import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { reportsController } from './reports.controller.js';
import {
  createReportSchema,
  reportIdSchema,
  reportQuerySchema,
  reviewReportSchema,
} from './reports.schema.js';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.post('/', validate(createReportSchema), reportsController.create);
reportsRouter.get('/', requireRole('ADMIN'), validate(reportQuerySchema, 'query'), reportsController.list);
reportsRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validate(reportIdSchema, 'params'),
  validate(reviewReportSchema),
  reportsController.review,
);
