import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';
import { propertyQuerySchema } from '../properties/properties.schema.js';

export const savedSearchSchema = z.object({
  name: z.string().trim().min(2).max(100),
  query: z.string().trim().max(500).optional(),
  filters: propertyQuerySchema.partial().default({}),
  notify: z.boolean().default(true),
});

export const savedSearchUpdateSchema = savedSearchSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const savedSearchIdSchema = z.object({ id: z.string().uuid() });
export const searchHistoryQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type SavedSearchInput = z.infer<typeof savedSearchSchema>;
export type SavedSearchUpdateInput = z.infer<typeof savedSearchUpdateSchema>;
