import rateLimit from 'express-rate-limit';
import { AppError } from './errorHandler.js';

const emailAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function cleanupEmailMap(now) {
  for (const [key, record] of emailAttempts.entries()) {
    if (record.resetAt <= now) {
      emailAttempts.delete(key);
    }
  }
}

export const loginIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, try again later' },
});

export function loginEmailLimiter(req, res, next) {
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (!email) return next();
  const now = Date.now();
  cleanupEmailMap(now);
  const record = emailAttempts.get(email);
  if (record && record.count >= MAX_ATTEMPTS && record.resetAt > now) {
    return next(new AppError(429, 'Too many login attempts, try again later'));
  }
  next();
}

export function registerEmailLoginAttempt(email, success) {
  const key = String(email || '').toLowerCase().trim();
  if (!key) return;
  const now = Date.now();
  const record = emailAttempts.get(key);
  if (success) {
    emailAttempts.delete(key);
    return;
  }
  if (!record || record.resetAt <= now) {
    emailAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count += 1;
  }
}
