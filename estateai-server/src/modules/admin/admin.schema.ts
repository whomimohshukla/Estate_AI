import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';

export const adminUserQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  role: z.enum(['BUYER', 'AGENT', 'ADMIN']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export const adminUserIdSchema = z.object({ id: z.string().uuid() });

export const adminUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const adminUserRoleSchema = z.object({
  role: z.enum(['BUYER', 'AGENT', 'ADMIN']),
});

export const auditLogQuerySchema = paginationSchema.extend({
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
});

export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
export type AdminUserStatusInput = z.infer<typeof adminUserStatusSchema>;
export type AdminUserRoleInput = z.infer<typeof adminUserRoleSchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
