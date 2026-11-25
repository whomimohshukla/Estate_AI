import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';

export const AMENITIES = [
  'PARKING',
  'GYM',
  'LIFT',
  'SECURITY',
  'SWIMMING_POOL',
  'GARDEN',
  'BALCONY',
  'AIR_CONDITIONING',
  'POWER_BACKUP',
  'SCHOOL_NEARBY',
  'HOSPITAL_NEARBY',
  'SHOPPING_NEARBY',
  'PET_FRIENDLY',
] as const;

const amenitySchema = z.enum(AMENITIES);

export const createPropertySchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(5000),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL']),
  purpose: z.enum(['SALE', 'RENT']),
  price: z.coerce.number().positive().max(1_000_000_000),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20),
  areaSqFt: z.coerce.number().int().min(100).max(100_000),
  amenities: z.array(amenitySchema).max(AMENITIES.length).default([]),
  furnishing: z.enum(['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED']).default('UNFURNISHED'),
  parking: z.coerce.boolean().default(false),
  metroDistanceKm: z.coerce.number().min(0).max(200).nullable().optional(),
  address: z.string().trim().min(5).max(250),
  locality: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100).default('India'),
  postalCode: z.string().trim().min(3).max(20),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
});

export const updatePropertySchema = createPropertySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const propertyQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  locality: z.string().trim().max(100).optional(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL']).optional(),
  purpose: z.enum(['SALE', 'RENT']).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  bathrooms: z.coerce.number().int().min(0).max(20).optional(),
  minArea: z.coerce.number().int().nonnegative().optional(),
  maxArea: z.coerce.number().int().positive().optional(),
  amenities: z.preprocess(
    (value) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value),
    z.array(amenitySchema).optional(),
  ),
  parking: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  furnishing: z.enum(['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED']).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(100).optional(),
  sortBy: z.enum(['createdAt', 'price', 'areaSqFt', 'bedrooms']).default('createdAt'),
});

export const propertyIdSchema = z.object({ id: z.string().uuid() });
export const imageIdSchema = z.object({ id: z.string().uuid(), imageId: z.string().uuid() });

export const statusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'AVAILABLE', 'SOLD', 'RENTED', 'ARCHIVED']),
});

export const imageOrderSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1),
});

export const moderationSchema = z.object({
  reason: z.string().trim().min(5).max(500).optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyQueryInput = z.infer<typeof propertyQuerySchema>;
