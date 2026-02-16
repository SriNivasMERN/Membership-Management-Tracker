import AuditLog from '../models/AuditLog.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'newPassword',
  'oldPassword',
  'passwordHash',
  'refreshToken',
  'accessToken',
  'setupToken',
  'code',
  'tokenHash',
  'token',
  'secret',
  'cookie',
  'cookies',
]);

function redactValue(value) {
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === 'object') {
    const result = {};
    for (const [key, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactValue(v);
      }
    }
    return result;
  }
  return value;
}

export async function writeAuditLog({
  req,
  actorUserId = null,
  actorRole = null,
  actionType,
  entityType,
  entityId = null,
  before = null,
  after = null,
}) {
  try {
    const ipAddress = req?.ip || '';
    const userAgent = req?.headers?.['user-agent'] || '';
    await AuditLog.create({
      actorUserId,
      actorRole,
      actionType,
      entityType,
      entityId: entityId ? String(entityId) : null,
      before: before ? redactValue(before) : null,
      after: after ? redactValue(after) : null,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    });
  } catch (err) {
    // audit failure must not break primary flow
    if (process.env.NODE_ENV !== 'production') {
      console.error('Audit log write failed:', err.message);
    }
  }
}
