import { AppError } from './errorHandler.js';

export function requireCsrf(req, res, next) {
  const csrfCookie = req.cookies?.['XSRF-TOKEN'];
  const csrfHeader = req.headers['x-csrf-token'];
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return next(new AppError(403, 'CSRF validation failed'));
  }
  next();
}

export function requireCsrfForStateChange(req, res, next) {
  const method = String(req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }
  return requireCsrf(req, res, next);
}
