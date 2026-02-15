import { z } from 'zod';

export const pricingModeEnum = z.enum(['PLAN_ONLY', 'PLAN_PLUS_SLOT_MULTIPLIER']);

export const settingsSchema = z.object({
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  branchName: z.string().min(1),
  logoUrl: z.string().url().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  memberLabel: z.string().min(1),
  planLabel: z.string().min(1),
  slotLabel: z.string().min(1),
  currencySymbol: z.string().min(1),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  slotDurationMinutes: z.number().int().min(1),
  nearingExpiryDays: z.number().int().min(0),
  pricingMode: pricingModeEnum,
});

export const updateSettingsSchema = settingsSchema.partial();

