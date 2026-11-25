import { z } from 'zod';

export const compareSchema = z.object({
  propertyIds: z.array(z.string().uuid()).min(2).max(3),
}).refine((value) => new Set(value.propertyIds).size === value.propertyIds.length, {
  message: 'propertyIds must be unique',
});

export type CompareInput = z.infer<typeof compareSchema>;
