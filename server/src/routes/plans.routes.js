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
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requirePermission('CONFIG_MANAGE'), listPlans);
router.get('/:id', requirePermission('CONFIG_MANAGE'), getPlan);
router.post('/', requirePermission('CONFIG_MANAGE'), validateRequest(planBodySchema), createPlan);
router.put('/:id', requirePermission('CONFIG_MANAGE'), validateRequest(planBodySchema), updatePlan);
router.patch('/:id/deactivate', requirePermission('CONFIG_MANAGE'), togglePlanActive);

export default router;

