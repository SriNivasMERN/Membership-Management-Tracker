import { z } from 'zod';
import { objectIdSchema } from './common.js';

const baseMemberSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  selectedPlanId: objectIdSchema,
  selectedSlotId: objectIdSchema,
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  price: z.number().min(0),
  fullyPaid: z.boolean(),
  pendingAmount: z.number().min(0),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  const start = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
  const end = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
  if (end < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'endDate must be on or after startDate',
    });
  }

  if (data.fullyPaid && data.pendingAmount !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pendingAmount'],
      message: 'pendingAmount must be 0 when fullyPaid is true',
    });
  }

  if (!data.fullyPaid && data.pendingAmount < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pendingAmount'],
      message: 'pendingAmount cannot be negative',
    });
  }
});

export const memberBodySchema = baseMemberSchema;

