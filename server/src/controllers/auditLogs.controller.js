import AuditLog from '../models/AuditLog.js';
import { createSuccessResponse } from '../utils/response.js';
import { auditLogQuerySchema } from '../validation/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listAuditLogs(req, res, next) {
  const parsed = auditLogQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new AppError(422, 'Validation error', { query: 'Invalid pagination params' }));
  }
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const [items, totalItems] = await Promise.all([
    AuditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments({}),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  res.json(
    createSuccessResponse({
      items,
      pagination: { page, limit, totalItems, totalPages },
    })
  );
}
