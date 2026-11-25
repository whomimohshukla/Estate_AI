import { z } from 'zod';

export const chatSchema = z
  .object({
    message: z.string().trim().min(2).max(1000),
    propertyId: z.string().uuid().optional(),
    conversationId: z.string().uuid().optional(),
  })
  .refine((data) => Boolean(data.propertyId || data.conversationId), {
    message: 'Provide a propertyId or an existing conversationId',
  });

export const conversationIdSchema = z.object({ id: z.string().uuid() });

export type ChatInput = z.infer<typeof chatSchema>;
