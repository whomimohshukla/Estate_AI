import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function paginationSkipTake(input: PaginationInput): { skip: number; take: number } {
  return { skip: (input.page - 1) * input.limit, take: input.limit };
}

export function paginationMeta(input: PaginationInput, total: number): Record<string, unknown> {
  return {
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.ceil(total / input.limit),
    hasNext: input.page * input.limit < total,
    hasPrevious: input.page > 1,
  };
}
