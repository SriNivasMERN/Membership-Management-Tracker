import User from '../models/User.js';
import UserSession from '../models/UserSession.js';
import { AppError } from '../middleware/errorHandler.js';
import { createSuccessResponse } from '../utils/response.js';
import { writeAuditLog } from '../utils/audit.js';
import {
  adminIssueInitialResetToken,
  getBootstrapPasswordHash,
} from './auth.controller.js';

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

async function countActiveAdmins() {
  return User.countDocuments({ role: 'ADMIN', isActive: true });
}

export async function listUsers(req, res) {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json(createSuccessResponse(users.map(sanitizeUser)));
}

export async function createUser(req, res, next) {
  const body = req.validated?.body || req.body;
  const normalizedEmail = String(body.email || '').toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return next(new AppError(409, 'User already exists'));

  const user = await User.create({
    name: body.name,
    email: normalizedEmail,
    mobile: body.mobile || undefined,
    passwordHash: await getBootstrapPasswordHash(),
    role: body.role,
    isActive: body.isActive ?? true,
    mustChangePassword: true,
    tokenVersion: 0,
  });

  const onboarding = await adminIssueInitialResetToken({
    userId: user._id,
    createdByUserId: req.user?._id || null,
  });

  await writeAuditLog({
    req,
    actorUserId: req.auth.userId,
    actorRole: req.auth.role,
    actionType: 'USER_CREATE',
    entityType: 'USER',
    entityId: user._id,
    after: sanitizeUser(user),
  });

  res.status(201).json(
    createSuccessResponse({
      user: sanitizeUser(user),
      onboarding: {
        resetCode: onboarding.resetCode,
        resetExpiresAt: onboarding.expiresAt,
      },
    })
  );
}

export async function updateUser(req, res, next) {
  const { id } = req.params;
  const body = req.validated?.body || req.body;
  const user = await User.findById(id);
  if (!user) return next(new AppError(404, 'User not found'));

  const before = sanitizeUser(user);
  const nextRole = body.role !== undefined ? body.role : user.role;
  const nextIsActive = body.isActive !== undefined ? body.isActive : user.isActive;
  const wasActiveAdmin = user.role === 'ADMIN' && user.isActive;
  const remainsActiveAdmin = nextRole === 'ADMIN' && nextIsActive;

  if (wasActiveAdmin && !remainsActiveAdmin) {
    const activeAdminCount = await countActiveAdmins();
    if (activeAdminCount <= 1) {
      return next(new AppError(422, 'At least one active admin is required'));
    }
  }

  if (body.name !== undefined) user.name = body.name;
  if (body.role !== undefined) user.role = nextRole;
  if (body.mobile !== undefined) user.mobile = body.mobile || undefined;
  if (body.isActive !== undefined) {
    user.isActive = nextIsActive;
  }
  await user.save();

  if (body.isActive === false) {
    await UserSession.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  await writeAuditLog({
    req,
    actorUserId: req.auth.userId,
    actorRole: req.auth.role,
    actionType: 'USER_UPDATE',
    entityType: 'USER',
    entityId: user._id,
    before,
    after: sanitizeUser(user),
  });
  res.json(createSuccessResponse(sanitizeUser(user)));
}

export async function deactivateUser(req, res, next) {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return next(new AppError(404, 'User not found'));
  if (user.role === 'ADMIN') {
    const activeAdminCount = await countActiveAdmins();
    if (activeAdminCount <= 1) {
      return next(new AppError(422, 'At least one active admin is required'));
    }
  }

  const before = sanitizeUser(user);
  user.isActive = false;
  await user.save();
  await UserSession.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  await writeAuditLog({
    req,
    actorUserId: req.auth.userId,
    actorRole: req.auth.role,
    actionType: 'USER_DEACTIVATE',
    entityType: 'USER',
    entityId: user._id,
    before,
    after: sanitizeUser(user),
  });
  res.json(createSuccessResponse(sanitizeUser(user)));
}

export async function resetUserPassword(req, res, next) {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return next(new AppError(404, 'User not found'));

  if (!user.isActive) {
    return next(new AppError(422, 'Cannot reset password for inactive user'));
  }

  user.mustChangePassword = true;
  await user.save();

  const resetData = await adminIssueInitialResetToken({
    userId: user._id,
    createdByUserId: req.user?._id || null,
  });

  await UserSession.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  await writeAuditLog({
    req,
    actorUserId: req.auth.userId,
    actorRole: req.auth.role,
    actionType: 'PASSWORD_RESET_ISSUED',
    entityType: 'USER',
    entityId: user._id,
  });
  res.json(
    createSuccessResponse({
      user: sanitizeUser(user),
      reset: {
        resetCode: resetData.resetCode,
        resetExpiresAt: resetData.expiresAt,
      },
    })
  );
}
