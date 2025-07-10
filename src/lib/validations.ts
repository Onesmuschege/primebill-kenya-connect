
import { z } from 'zod';

// Common validation schemas
export const phoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^(\+254|254|0)(7|1)[0-9]{8}$/, 'Please enter a valid Kenyan phone number');

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters');

// Payment form validation
export const paymentFormSchema = z.object({
  planId: z.string().min(1, 'Please select a plan'),
  phoneNumber: phoneNumberSchema,
});

// Profile form validation
export const profileFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneNumberSchema,
});

// Plan creation form validation
export const planFormSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  price_kes: z.number().min(1, 'Price must be greater than 0'),
  speed_limit_mbps: z.number().min(1, 'Speed must be greater than 0'),
  validity_days: z.number().min(1, 'Validity must be at least 1 day'),
});

// User management form validation
export const userFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneNumberSchema,
  role: z.enum(['admin', 'subadmin', 'client']),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PlanFormData = z.infer<typeof planFormSchema>;
export type UserFormData = z.infer<typeof userFormSchema>;
