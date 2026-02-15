import Settings from '../models/Settings.js';
import { ensureDefaultSettings } from '../utils/seedDefaults.js';
import { createSuccessResponse } from '../utils/response.js';

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

  Object.assign(settings, updates);
  await settings.save();
  res.json(createSuccessResponse(settings));
}

