import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { validatedQuery } from '../../utils/validated-query.js';
import type { CreateReportInput, ReportQueryInput, ReviewReportInput } from './reports.schema.js';
import { reportsService } from './reports.service.js';

export const reportsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportsService.create(req.user!.id, req.body as CreateReportInput);
    return success(res, { report }, 'Report submitted', 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { reports, meta } = await reportsService.list(validatedQuery<ReportQueryInput>(req));
    return success(res, { reports }, 'Reports retrieved', 200, meta);
  }),

  review: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportsService.review(req.user!.id, req.params.id!, req.body as ReviewReportInput);
    return success(res, { report }, 'Report reviewed');
  }),
};
