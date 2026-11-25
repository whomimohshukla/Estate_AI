import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';

export const notificationIdSchema = z.object({ id: z.string().uuid() });

export const notificationQuerySchema = paginationSchema.extend({
  unreadOnly: z.enum(['true', 'false']).transform((value) => value === 'true').default('false'),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
