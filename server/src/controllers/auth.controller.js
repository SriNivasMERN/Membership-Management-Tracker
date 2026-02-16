import User from '../models/User.js';
import UserSession from '../models/UserSession.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import SystemState from '../models/SystemState.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  createPasswordResetCode,
  getDefaultAdminEmail,
  getPasswordResetExpiresAt,
  getRandomPasswordPlaceholder,
  getSessionId,
  getSetupToken,
  hashPassword,
  hashRefreshToken,
  hashToken,
  secureTokenEquals,
  signAccessToken,
  signRefreshToken,
  validatePasswordStrength,
  verifyPassword,
  verifyRefreshToken,
} from '../utils/auth.js';
import {
  clearAccessCookie,
  clearCsrfCookie,
  clearRefreshCookie,
  generateCsrfToken,
  setAccessCookie,
  setCsrfCookie,
  setRefreshCookie,
} from '../utils/cookies.js';
import { createSuccessResponse } from '../utils/response.js';
import { registerEmailLoginAttempt } from '../middleware/rateLimit.js';
import { writeAuditLog } from '../utils/audit.js';

const LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const SETUP_STATE_KEY = 'INITIAL_SETUP';

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getSetupState() {
  let state = await SystemState.findOne({ key: SETUP_STATE_KEY });
  if (!state) {
    state = await SystemState.create({ key: SETUP_STATE_KEY, setupCompleted: false });
  }
  return state;
}

async function isSetupRequired() {
  const [state, adminCount] = await Promise.all([
    getSetupState(),
    User.countDocuments({ role: 'ADMIN' }),
  ]);
  return !state.setupCompleted && adminCount === 0;
}

async function createSessionAndCookies({ user, req, res }) {
  const sessionId = getSessionId();
  const payload = {
    userId: String(user._id),
    role: user.role,
    sessionId,
    tokenVersion: user.tokenVersion,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await UserSession.create({
    userId: user._id,
    sessionId,
    refreshTokenHash,
    createdAt: now,
    expiresAt,
    revokedAt: null,
    lastUsedAt: now,
    ipAddress: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
  });

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res, generateCsrfToken());
}

function clearAuthCookies(res) {
  clearAccessCookie(res);
  clearRefreshCookie(res);
  clearCsrfCookie(res);
}

export async function setupStatus(req, res) {
  const setupRequired = await isSetupRequired();
  res.json(createSuccessResponse({ setupRequired }));
}

export async function completeSetup(req, res, next) {
  const body = req.validated?.body || req.body;
  const setupRequired = await isSetupRequired();
  if (!setupRequired) {
    return next(new AppError(403, 'Setup already completed'));
  }

  if (!secureTokenEquals(getSetupToken(), body.setupToken)) {
    return next(new AppError(403, 'Invalid setup credentials'));
  }

  const expectedEmail = getDefaultAdminEmail();
  const providedEmail = String(body.email || '').toLowerCase().trim();
  if (providedEmail !== expectedEmail) {
    return next(new AppError(403, 'Invalid setup credentials'));
  }

  const strengthError = validatePasswordStrength(body.password);
  if (strengthError) return next(new AppError(422, strengthError));

  const state = await getSetupState();
  const admin = await User.create({
    name: body.name || 'Business Owner',
    email: expectedEmail,
    mobile: undefined,
    passwordHash: await hashPassword(body.password),
    role: 'ADMIN',
    isActive: true,
    mustChangePassword: false,
    tokenVersion: 0,
  });

  state.setupCompleted = true;
  state.setupCompletedAt = new Date();
  await state.save();

  await writeAuditLog({
    req,
    actorUserId: admin._id,
    actorRole: admin.role,
    actionType: 'SETUP_COMPLETE',
    entityType: 'AUTH',
    entityId: admin._id,
    after: sanitizeUser(admin),
  });

  res.status(201).json(createSuccessResponse({ setupCompleted: true }));
}

export async function login(req, res, next) {
  const body = req.validated?.body || req.body;
  const email = String(body.email || '').toLowerCase().trim();
  const invalidCredentials = new AppError(401, 'Invalid credentials');

  const user = await User.findOne({ email });
  if (!user) {
    registerEmailLoginAttempt(email, false);
    await writeAuditLog({
      req,
      actionType: 'LOGIN_FAIL',
      entityType: 'AUTH',
      before: null,
      after: { email },
    });
    return next(invalidCredentials);
  }

  const now = Date.now();
  if (user.lockUntil && user.lockUntil.getTime() > now) {
    registerEmailLoginAttempt(email, false);
    await writeAuditLog({
      req,
      actorUserId: user._id,
      actorRole: user.role,
      actionType: 'LOGIN_FAIL',
      entityType: 'AUTH',
      entityId: user._id,
      after: { reason: 'LOCKED' },
    });
    return next(invalidCredentials);
  }

  const passwordOk = await verifyPassword(body.password, user.passwordHash);
  if (!passwordOk || !user.isActive) {
    user.failedLoginCount = (user.failedLoginCount || 0) + 1;
    if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
      user.lockUntil = new Date(now + LOCK_WINDOW_MS);
      user.failedLoginCount = 0;
    }
    await user.save();
    registerEmailLoginAttempt(email, false);
    await writeAuditLog({
      req,
      actorUserId: user._id,
      actorRole: user.role,
      actionType: 'LOGIN_FAIL',
      entityType: 'AUTH',
      entityId: user._id,
      after: { reason: 'INVALID_CREDENTIALS' },
    });
    return next(invalidCredentials);
  }

  user.failedLoginCount = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  registerEmailLoginAttempt(email, true);
  await createSessionAndCookies({ user, req, res });
  await writeAuditLog({
    req,
    actorUserId: user._id,
    actorRole: user.role,
    actionType: 'LOGIN_SUCCESS',
    entityType: 'AUTH',
    entityId: user._id,
  });
  res.json(createSuccessResponse({ user: sanitizeUser(user) }));
}

export async function refresh(req, res, next) {
  const token = req.cookies?.refreshToken;
  if (!token) return next(new AppError(401, 'Unauthenticated'));

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    return next(new AppError(401, 'Unauthenticated'));
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    clearAuthCookies(res);
    return next(new AppError(401, 'Unauthenticated'));
  }

  const existingSession = await UserSession.findOne({
    sessionId: payload.sessionId,
    userId: user._id,
  });
  const presentedHash = hashRefreshToken(token);

  if (
    !existingSession ||
    existingSession.revokedAt ||
    existingSession.expiresAt.getTime() <= Date.now() ||
    existingSession.refreshTokenHash !== presentedHash
  ) {
    await UserSession.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    clearAuthCookies(res);
    await writeAuditLog({
      req,
      actorUserId: user._id,
      actorRole: user.role,
      actionType: 'TOKEN_REUSE_DETECTED',
      entityType: 'AUTH',
      entityId: user._id,
    });
    return next(new AppError(401, 'Unauthenticated'));
  }

  existingSession.revokedAt = new Date();
  existingSession.lastUsedAt = new Date();
  await existingSession.save();

  await createSessionAndCookies({ user, req, res });
  res.json(createSuccessResponse({ user: sanitizeUser(user) }));
}

export async function logout(req, res) {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await UserSession.updateMany(
        { sessionId: payload.sessionId, userId: payload.userId, revokedAt: null },
        { $set: { revokedAt: new Date(), lastUsedAt: new Date() } }
      );
      await writeAuditLog({
        req,
        actorUserId: payload.userId,
        actorRole: payload.role,
        actionType: 'LOGOUT',
        entityType: 'AUTH',
        entityId: payload.userId,
      });
    } catch {
      // ignore malformed token on logout
    }
  }
  clearAuthCookies(res);
  res.json(createSuccessResponse({ loggedOut: true }));
}

export async function me(req, res, next) {
  const auth = req.auth;
  if (!auth) return next(new AppError(401, 'Unauthenticated'));
  const user = await User.findById(auth.userId);
  if (!user || !user.isActive) return next(new AppError(401, 'Unauthenticated'));
  res.json(createSuccessResponse(sanitizeUser(user)));
}

export async function changePassword(req, res, next) {
  const user = req.user;
  if (!user) return next(new AppError(401, 'Unauthenticated'));
  const body = req.validated?.body || req.body;

  const validCurrent = await verifyPassword(body.oldPassword, user.passwordHash);
  if (!validCurrent) return next(new AppError(422, 'Current password is incorrect'));
  const strengthError = validatePasswordStrength(body.newPassword);
  if (strengthError) return next(new AppError(422, strengthError));

  user.passwordHash = await hashPassword(body.newPassword);
  user.mustChangePassword = false;
  user.tokenVersion += 1;
  await user.save();

  await UserSession.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  await createSessionAndCookies({ user, req, res });
  await writeAuditLog({
    req,
    actorUserId: user._id,
    actorRole: user.role,
    actionType: 'PASSWORD_CHANGE',
    entityType: 'AUTH',
    entityId: user._id,
  });
  res.json(createSuccessResponse({ user: sanitizeUser(user) }));
}

export async function resetPassword(req, res, next) {
  const body = req.validated?.body || req.body;
  const email = String(body.email || '').toLowerCase().trim();
  const invalidReset = new AppError(400, 'Invalid or expired reset code');

  const user = await User.findOne({ email });
  if (!user || !user.isActive) return next(invalidReset);

  const tokenHash = hashToken(body.code);
  const resetRecord = await PasswordResetToken.findOne({
    userId: user._id,
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!resetRecord) return next(invalidReset);

  const strengthError = validatePasswordStrength(body.newPassword);
  if (strengthError) return next(new AppError(422, strengthError));

  user.passwordHash = await hashPassword(body.newPassword);
  user.mustChangePassword = false;
  user.failedLoginCount = 0;
  user.lockUntil = null;
  user.tokenVersion += 1;
  await user.save();

  resetRecord.usedAt = new Date();
  await resetRecord.save();

  await UserSession.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  await writeAuditLog({
    req,
    actorUserId: user._id,
    actorRole: user.role,
    actionType: 'PASSWORD_RESET_COMPLETE',
    entityType: 'AUTH',
    entityId: user._id,
  });

  clearAuthCookies(res);
  res.json(createSuccessResponse({ passwordReset: true }));
}

export async function adminIssueInitialResetToken({
  userId,
  createdByUserId = null,
}) {
  const code = createPasswordResetCode();
  const tokenHash = hashToken(code);
  const expiresAt = getPasswordResetExpiresAt();

  await PasswordResetToken.updateMany(
    { userId, usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  await PasswordResetToken.create({
    userId,
    tokenHash,
    expiresAt,
    usedAt: null,
    createdByUserId,
  });

  return {
    resetCode: code,
    expiresAt,
  };
}

export async function getBootstrapPasswordHash() {
  const randomPassword = getRandomPasswordPlaceholder();
  return hashPassword(randomPassword);
}
