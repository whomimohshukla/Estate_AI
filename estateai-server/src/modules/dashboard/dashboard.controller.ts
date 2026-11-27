import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  buyer: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.buyer({ id: req.user!.id, role: req.user!.role });
    return success(res, data, 'Buyer dashboard ready');
  }),

  agent: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.agent({ id: req.user!.id, role: req.user!.role });
    return success(res, data, 'Agent dashboard ready');
  }),

  admin: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.admin();
    return success(res, data, 'Admin dashboard ready');
  }),

  analytics: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.admin();
    return success(res, data, 'Platform analytics ready');
  }),
};
