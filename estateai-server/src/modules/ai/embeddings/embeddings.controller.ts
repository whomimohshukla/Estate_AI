import type { Request, Response } from 'express';
import { prisma } from '../../../config/database.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import { success } from '../../../utils/api-response.js';
import { getOwnedForManagement } from '../../properties/properties.service.js';
import { embeddingsService } from './embeddings.service.js';

export const embeddingsController = {
  syncProperty: asyncHandler(async (req: Request, res: Response) => {
    const propertyId = req.params.propertyId!;
    await getOwnedForManagement(propertyId, { id: req.user!.id, role: req.user!.role });

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) return success(res, { synced: false }, 'Property not found');

    const synced = await embeddingsService.syncProperty(property);
    return success(res, { synced }, synced ? 'Embedding updated' : 'Embedding already current');
  }),

  reindex: asyncHandler(async (_req: Request, res: Response) => {
    const synced = await embeddingsService.reindexAll();
    return success(res, { reindexed: synced, synced }, 'Embeddings reindexed');
  }),
};
