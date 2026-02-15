import { z } from 'zod';

export const slotBodySchema = z
  .object({
    slotLabel: z.string().min(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => data.startTime < data.endTime,
    { message: 'startTime must be before endTime', path: ['startTime'] }
  );

