import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateSettingsSchema } from '../validation/settings.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', validateRequest(updateSettingsSchema), updateSettings);

export default router;

