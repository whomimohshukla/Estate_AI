import { z } from 'zod';
import { AMENITIES } from '../../properties/properties.schema.js';

export const aiSearchSchema = z.object({
  query: z.string().trim().min(3).max(500),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const extractedFiltersSchema = z
  .object({
    city: z.string().trim().max(100).nullable().optional(),
    locality: z.string().trim().max(100).nullable().optional(),
    propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL']).nullable().optional(),
    purpose: z.enum(['SALE', 'RENT']).nullable().optional(),
    bedrooms: z.coerce.number().int().min(0).max(20).nullable().optional(),
    bathrooms: z.coerce.number().int().min(0).max(20).nullable().optional(),
    minPrice: z.coerce.number().nonnegative().max(1_000_000_000).nullable().optional(),
    maxPrice: z.coerce.number().nonnegative().max(1_000_000_000).nullable().optional(),
    amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length).default([]),
    parking: z.boolean().nullable().optional(),
    furnishing: z.enum(['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED']).nullable().optional(),
  })
  .refine((value) => value.minPrice == null || value.maxPrice == null || value.minPrice <= value.maxPrice, {
    message: 'minPrice cannot exceed maxPrice',
  });

export type ExtractedFilters = z.infer<typeof extractedFiltersSchema>;
export type AiSearchInput = z.infer<typeof aiSearchSchema>;
