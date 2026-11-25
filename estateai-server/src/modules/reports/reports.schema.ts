import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';

export const createReportSchema = z.object({
  propertyId: z.string().uuid(),
  reason: z.string().trim().min(5).max(500),
  details: z.string().trim().max(2000).optional(),
});

export const reportIdSchema = z.object({ id: z.string().uuid() });

export const reportQuerySchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']).optional(),
});

export const reviewReportSchema = z.object({
  status: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED']),
  details: z.string().trim().max(2000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type ReviewReportInput = z.infer<typeof reviewReportSchema>;
