import { z } from 'zod';
import { objectIdSchema } from './common.js';

export const pricingRuleBodySchema = z.object({
  planId: objectIdSchema,
  slotId: objectIdSchema,
  multiplier: z.number().min(0),
});

