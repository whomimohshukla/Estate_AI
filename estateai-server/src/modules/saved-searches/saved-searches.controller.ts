import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import type { SavedSearchInput, SavedSearchUpdateInput } from './saved-searches.schema.js';
import { savedSearchesService } from './saved-searches.service.js';

export const savedSearchesController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const savedSearch = await savedSearchesService.create(req.user!.id, req.body as SavedSearchInput);
    return success(res, { savedSearch }, 'Saved search created', 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const savedSearches = await savedSearchesService.list(req.user!.id);
    return success(res, { savedSearches }, 'Saved searches retrieved');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const savedSearch = await savedSearchesService.update(req.user!.id, req.params.id!, req.body as SavedSearchUpdateInput);
    return success(res, { savedSearch }, 'Saved search updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await savedSearchesService.remove(req.user!.id, req.params.id!);
    return success(res, { deleted: true }, 'Saved search deleted');
  }),

  listHistory: asyncHandler(async (req: Request, res: Response) => {
    const history = await savedSearchesService.listHistory(
      req.user!.id,
      (req as Request & { validatedQuery?: { limit: number } }).validatedQuery?.limit ?? 50,
    );
    return success(res, { history }, 'Search history retrieved');
  }),

  clearHistory: asyncHandler(async (req: Request, res: Response) => {
    const deleted = await savedSearchesService.clearHistory(req.user!.id);
    return success(res, { deleted }, 'Search history cleared');
  }),
};
