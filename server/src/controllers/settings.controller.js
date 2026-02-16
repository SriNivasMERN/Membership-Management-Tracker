import Settings from '../models/Settings.js';
import { ensureDefaultSettings } from '../utils/seedDefaults.js';
import { createSuccessResponse } from '../utils/response.js';
import { writeAuditLog } from '../utils/audit.js';

export async function getSettings(req, res) {
  const settings = await ensureDefaultSettings();
  res.json(createSuccessResponse(settings));
}

export async function updateSettings(req, res) {
  const updates = req.validated?.body || req.body;
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings({});
  }

  const before = settings.toObject();
  Object.assign(settings, updates);
  await settings.save();
  await writeAuditLog({
    req,
    actorUserId: req.auth?.userId,
    actorRole: req.auth?.role,
    actionType: 'UPDATE',
    entityType: 'SETTINGS',
    entityId: settings._id,
    before,
    after: settings.toObject(),
  });
  res.json(createSuccessResponse(settings));
}

