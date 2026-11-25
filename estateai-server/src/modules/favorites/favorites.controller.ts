import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { favoritesService } from './favorites.service.js';

export const favoritesController = {
  add: asyncHandler(async (req: Request, res: Response) => {
    const favorite = await favoritesService.add(req.user!.id, req.params.propertyId!);
    return success(res, { favorite }, 'Property added to favorites', 201);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await favoritesService.remove(req.user!.id, req.params.propertyId!);
    return success(res, { deleted: true }, 'Property removed from favorites');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const properties = await favoritesService.list(req.user!.id);
    return success(res, { properties }, 'Favorites retrieved');
  }),

  check: asyncHandler(async (req: Request, res: Response) => {
    const isFavorite = await favoritesService.isFavorite(req.user!.id, req.params.propertyId!);
    return success(res, { isFavorite }, 'Favorite status retrieved');
  }),
};
