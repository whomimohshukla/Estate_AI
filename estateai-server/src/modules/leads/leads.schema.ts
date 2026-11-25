import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';

export const createLeadSchema = z.object({
  propertyId: z.string().uuid(),
  message: z.string().trim().min(5).max(2000),
  requirements: z.string().trim().max(2000).optional(),
  budgetMax: z.coerce.number().positive().max(1_000_000_000).optional(),
});

export const leadQuerySchema = paginationSchema.extend({
  status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'LOST']).optional(),
  propertyId: z.string().uuid().optional(),
});

export const leadIdSchema = z.object({ id: z.string().uuid() });

export const updateLeadSchema = z
  .object({
    status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'LOST']).optional(),
    requirements: z.string().trim().max(2000).optional(),
    budgetMax: z.coerce.number().positive().max(1_000_000_000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const leadActivitySchema = z.object({
  type: z.enum(['NOTE', 'FOLLOW_UP', 'CALL', 'EMAIL', 'WHATSAPP', 'OTHER']),
  notes: z.string().trim().min(2).max(2000),
  dueAt: z.coerce.date().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadActivityInput = z.infer<typeof leadActivitySchema>;
