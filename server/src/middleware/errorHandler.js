import { ZodError } from 'zod';
import { createErrorResponse } from '../utils/response.js';

export class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function notFoundHandler(req, res, next) {
  res.status(404).json(createErrorResponse('Route not found'));
}

export function errorHandler(err, req, res, next) {
  // Zod validation errors not passed through AppError
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const errors = Object.fromEntries(
      Object.entries(fieldErrors).map(([key, value]) => [key, value.join(', ')])
    );
    return res.status(400).json(createErrorResponse('Validation error', errors));
  }

  // Mongoose duplicate key / validation errors
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res
      .status(409)
      .json(createErrorResponse('Duplicate key error', { duplicate: err.keyValue }));
  }

  if (err.name === 'ValidationError') {
    const errors = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] = detail.message;
    }
    return res.status(400).json(createErrorResponse('Validation error', errors));
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors;

  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
  }

  return res.status(statusCode).json(createErrorResponse(message, errors));
}

