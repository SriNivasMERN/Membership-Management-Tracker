import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '14d';
const REFRESH_TOKEN_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const RESET_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function getAccessTokenSecret() {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET is required');
  return secret;
}

export function getRefreshTokenSecret() {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is required');
  return secret;
}

export function getSetupToken() {
  const token = process.env.SETUP_TOKEN;
  if (!token) throw new Error('SETUP_TOKEN is required');
  return token;
}

export function getDefaultAdminEmail() {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  if (!email) throw new Error('DEFAULT_ADMIN_EMAIL is required');
  return email.toLowerCase().trim();
}

export function getSessionId() {
  return crypto.randomUUID();
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashRefreshToken(token) {
  return hashToken(token);
}

export function createPasswordResetCode() {
  return crypto.randomBytes(24).toString('hex');
}

export function getPasswordResetExpiresAt() {
  return new Date(Date.now() + RESET_TOKEN_MAX_AGE_MS);
}

export function getRandomPasswordPlaceholder() {
  return crypto.randomBytes(48).toString('hex');
}

export function signAccessToken({ userId, role, sessionId, tokenVersion }) {
  return jwt.sign({ userId, role, sessionId, tokenVersion }, getAccessTokenSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function signRefreshToken({ userId, role, sessionId, tokenVersion }) {
  return jwt.sign({ userId, role, sessionId, tokenVersion }, getRefreshTokenSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessTokenSecret());
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshTokenSecret());
}

export function getRefreshTokenMaxAgeMs() {
  return REFRESH_TOKEN_MAX_AGE_MS;
}

export function getAccessTokenMaxAgeMs() {
  return ACCESS_TOKEN_MAX_AGE_MS;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'admin123',
  'qwerty123',
  'letmein123',
  'welcome123',
]);

export function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 10) {
    return 'Password must be at least 10 characters long';
  }
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must include a number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a special character';
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 'Password is too common';
  return null;
}

export function secureTokenEquals(expected, actual) {
  const expectedBuffer = Buffer.from(String(expected || ''), 'utf8');
  const actualBuffer = Buffer.from(String(actual || ''), 'utf8');
  if (expectedBuffer.length === 0 || expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
