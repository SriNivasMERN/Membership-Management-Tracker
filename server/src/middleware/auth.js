import { AppError } from './errorHandler.js';
import User from '../models/User.js';
import { verifyAccessToken } from '../utils/auth.js';

export const PERMISSIONS = {
  SETTINGS_MANAGE: ['ADMIN'],
  CONFIG_MANAGE: ['ADMIN'],
  MEMBERS_READ: ['ADMIN', 'STAFF', 'VIEWER'],
  MEMBERS_WRITE: ['ADMIN', 'STAFF'],
  DASHBOARD_READ: ['ADMIN', 'STAFF', 'VIEWER'],
  USERS_MANAGE: ['ADMIN'],
  AUDIT_READ: ['ADMIN'],
};

export async function requireAuth(req, res, next) {
  const cookieToken = req.cookies?.accessToken;
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const token = cookieToken || bearerToken;
  if (!token) {
    return next(new AppError(401, 'Unauthenticated'));
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(new AppError(401, 'Unauthenticated'));
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) {
    return next(new AppError(401, 'Unauthenticated'));
  }
  if (user.tokenVersion !== payload.tokenVersion) {
    return next(new AppError(401, 'Unauthenticated'));
  }

  req.auth = {
    userId: String(user._id),
    role: user.role,
    sessionId: payload.sessionId,
    tokenVersion: payload.tokenVersion,
    mustChangePassword: user.mustChangePassword,
  };
  req.user = user;
  next();
}

export function requireRole(allowedRoles) {
  const normalized = Array.isArray(allowedRoles) ? allowedRoles : [];
  return (req, res, next) => {
    if (!req.auth) return next(new AppError(401, 'Unauthenticated'));
    if (!normalized.includes(req.auth.role)) {
      return next(new AppError(403, 'Forbidden'));
    }
    return next();
  };
}

export function requirePermission(permissionKey) {
  const allowedRoles = PERMISSIONS[permissionKey] || [];
  return requireRole(allowedRoles);
}

export function requirePasswordChangeResolved(req, res, next) {
  if (req.auth?.mustChangePassword && req.path !== '/auth/change-password') {
    return next(new AppError(403, 'Password change required'));
  }
  next();
}
