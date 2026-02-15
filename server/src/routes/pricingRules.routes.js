import express from 'express';
import {
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from '../controllers/pricingRules.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { pricingRuleBodySchema } from '../validation/pricingRule.js';

const router = express.Router();

router.get('/', listPricingRules);
router.post('/', validateRequest(pricingRuleBodySchema), createPricingRule);
router.put('/:id', validateRequest(pricingRuleBodySchema), updatePricingRule);
router.delete('/:id', deletePricingRule);

export default router;

