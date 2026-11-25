import type { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { success } from '../../../utils/api-response.js';
import type { ChatInput } from './chat.schema.js';
import { chatService } from './chat.service.js';

export const chatController = {
  chat: asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.chat(
      req.user!.id,
      { id: req.user!.id, role: req.user!.role },
      req.body as ChatInput,
    );
    return success(res, result, 'Answer generated from verified listing data');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const conversations = await chatService.listConversations(req.user!.id);
    return success(res, { conversations }, 'Conversations retrieved');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const conversation = await chatService.getConversation(req.user!.id, req.params.id!);
    return success(res, { conversation }, 'Conversation retrieved');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await chatService.deleteConversation(req.user!.id, req.params.id!);
    return success(res, { deleted: true }, 'Conversation deleted');
  }),
};
