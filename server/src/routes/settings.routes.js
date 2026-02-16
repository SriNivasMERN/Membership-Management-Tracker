import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateSettingsSchema } from '../validation/settings.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requirePermission('DASHBOARD_READ'), getSettings);
router.put('/', requirePermission('SETTINGS_MANAGE'), validateRequest(updateSettingsSchema), updateSettings);

export default router;

