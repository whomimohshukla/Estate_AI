import type { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { success } from '../../../utils/api-response.js';
import { aiSearchService } from './search.service.js';
import type { AiSearchInput } from './search.schema.js';

export const aiSearchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const result = await aiSearchService.search(req.body as AiSearchInput, req.user ? { id: req.user.id } : undefined);
    return success(res, result, 'Search results ready');
  }),
};
