import crypto from 'crypto';
import { getAccessTokenMaxAgeMs, getRefreshTokenMaxAgeMs } from './auth.js';

function isProd() {
  return process.env.NODE_ENV === 'production';
}

function getSameSitePolicy() {
  const configured = String(process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (configured === 'none') return 'none';
  return 'lax';
}

function getSecurePolicy() {
  return isProd() || getSameSitePolicy() === 'none';
}

export function setAccessCookie(res, accessToken) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: getSecurePolicy(),
    sameSite: getSameSitePolicy(),
    path: '/api',
    maxAge: getAccessTokenMaxAgeMs(),
  });
}

export function clearAccessCookie(res) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: getSecurePolicy(),
    sameSite: getSameSitePolicy(),
    path: '/api',
  });
}

export function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: getSecurePolicy(),
    sameSite: getSameSitePolicy(),
    path: '/api/auth',
    maxAge: getRefreshTokenMaxAgeMs(),
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: getSecurePolicy(),
    sameSite: getSameSitePolicy(),
    path: '/api/auth',
  });
}

export function setCsrfCookie(res, token) {
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: getSecurePolicy(),
    sameSite: getSameSitePolicy(),
    path: '/',
    maxAge: getRefreshTokenMaxAgeMs(),
  });
}

export function clearCsrfCookie(res) {
  res.clearCookie('XSRF-TOKEN', {
    httpOnly: false,
    secure: getSecurePolicy(),
    sameSite: getSameSitePolicy(),
    path: '/',
  });
}

export function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}
