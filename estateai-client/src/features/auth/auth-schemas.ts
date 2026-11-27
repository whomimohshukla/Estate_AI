import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[0-9]/, 'Add a number')

export const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export const registerFormSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.union([
    z.literal(''),
    z.string().trim().min(10, 'Enter a valid phone number').max(15, 'Phone number is too long'),
  ]),
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['BUYER', 'AGENT']),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
})

export const forgotPasswordFormSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
})

export const resetPasswordFormSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
})

export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>
