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

const router = express.Router();

router.get('/', listSlots);
router.get('/:id', getSlot);
router.post('/', validateRequest(slotBodySchema), createSlot);
router.put('/:id', validateRequest(slotBodySchema), updateSlot);
router.patch('/:id/deactivate', toggleSlotActive);
router.post('/generate-missing', generateMissingSlots);

export default router;

