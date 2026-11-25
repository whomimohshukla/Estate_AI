import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { validatedQuery } from '../../utils/validated-query.js';
import { propertiesService } from '../properties/properties.service.js';
import type { PropertyQueryInput } from '../properties/properties.schema.js';

export const adminController = {
  listPending: asyncHandler(async (req: Request, res: Response) => {
    const query = validatedQuery<PropertyQueryInput>(req);
    const result = await propertiesService.listForAdmin(query, ['PENDING']);
    return success(res, result.items, 'Pending listings retrieved', 200, result.meta);
  }),

  listProperties: asyncHandler(async (req: Request, res: Response) => {
    const query = validatedQuery<PropertyQueryInput>(req);
    const result = await propertiesService.listForAdmin(query);
    return success(res, result.items, 'All listings retrieved', 200, result.meta);
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.approve(req.params.id!);
    return success(res, { property }, 'Listing approved');
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.reject(req.params.id!, (req.body as { reason?: string }).reason);
    return success(res, { property }, 'Listing rejected');
  }),

  requestCorrection: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertiesService.requestCorrection(req.params.id!, (req.body as { reason?: string }).reason);
    return success(res, { property }, 'Correction requested');
  }),
};
