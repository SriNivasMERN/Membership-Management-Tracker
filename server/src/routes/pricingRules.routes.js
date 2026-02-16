import express from 'express';
import {
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from '../controllers/pricingRules.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { pricingRuleBodySchema } from '../validation/pricingRule.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requirePermission('CONFIG_MANAGE'), listPricingRules);
router.post('/', requirePermission('CONFIG_MANAGE'), validateRequest(pricingRuleBodySchema), createPricingRule);
router.put('/:id', requirePermission('CONFIG_MANAGE'), validateRequest(pricingRuleBodySchema), updatePricingRule);
router.delete('/:id', requirePermission('CONFIG_MANAGE'), deletePricingRule);

export default router;

