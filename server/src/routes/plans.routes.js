import express from 'express';
import {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  togglePlanActive,
} from '../controllers/plans.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { planBodySchema } from '../validation/plan.js';

const router = express.Router();

router.get('/', listPlans);
router.get('/:id', getPlan);
router.post('/', validateRequest(planBodySchema), createPlan);
router.put('/:id', validateRequest(planBodySchema), updatePlan);
router.patch('/:id/deactivate', togglePlanActive);

export default router;

