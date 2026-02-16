import express from 'express';
import {
  listSlots,
  getSlot,
  createSlot,
  updateSlot,
  toggleSlotActive,
  generateMissingSlots,
} from '../controllers/slots.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { slotBodySchema } from '../validation/slot.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requirePermission('CONFIG_MANAGE'), listSlots);
router.get('/:id', requirePermission('CONFIG_MANAGE'), getSlot);
router.post('/', requirePermission('CONFIG_MANAGE'), validateRequest(slotBodySchema), createSlot);
router.put('/:id', requirePermission('CONFIG_MANAGE'), validateRequest(slotBodySchema), updateSlot);
router.patch('/:id/deactivate', requirePermission('CONFIG_MANAGE'), toggleSlotActive);
router.post('/generate-missing', requirePermission('CONFIG_MANAGE'), generateMissingSlots);

export default router;

