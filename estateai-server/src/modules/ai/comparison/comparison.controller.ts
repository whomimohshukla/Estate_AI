import type { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { success } from '../../../utils/api-response.js';
import type { CompareInput } from './comparison.schema.js';
import { comparisonService } from './comparison.service.js';

export const comparisonController = {
  compare: asyncHandler(async (req: Request, res: Response) => {
    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const result = await comparisonService.compare(req.body as CompareInput, viewer, req.user?.id);
    return success(res, result, 'Properties compared using verified listing data');
  }),

  listSaved: asyncHandler(async (req: Request, res: Response) => {
    const comparisons = await comparisonService.listSaved(req.user!.id);
    return success(res, { comparisons }, 'Saved comparisons retrieved');
  }),
};
