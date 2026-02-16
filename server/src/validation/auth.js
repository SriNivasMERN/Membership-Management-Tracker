import { z } from 'zod';
import { USER_ROLES } from '../models/User.js';
import { validatePasswordStrength } from '../utils/auth.js';

const roleEnum = z.enum(USER_ROLES);

const passwordSchema = z
  .string()
  .min(10)
  .superRefine((value, ctx) => {
    const err = validatePasswordStrength(value);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const setupSchema = z.object({
  setupToken: z.string().min(32),
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().optional().or(z.literal('')),
  role: roleEnum,
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  mobile: z.string().optional().or(z.literal('')),
});

export const issueResetCodeSchema = z.object({});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(20),
  newPassword: passwordSchema,
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
