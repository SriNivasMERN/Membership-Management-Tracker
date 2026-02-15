import { z } from 'zod';

export const planBodySchema = z.object({
  planName: z.string().min(1),
  basePrice: z.number().min(0),
  validityMonths: z.number().int().min(1),
  isActive: z.boolean().optional(),
});

