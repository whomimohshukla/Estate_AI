import { z } from 'zod';

export const favoritePropertySchema = z.object({ propertyId: z.string().uuid() });
