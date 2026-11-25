import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { leadsController } from './leads.controller.js';
import {
  createLeadSchema,
  leadActivitySchema,
  leadIdSchema,
  leadQuerySchema,
  updateLeadSchema,
} from './leads.schema.js';

export const leadsRouter = Router();

leadsRouter.use(requireAuth);

leadsRouter.post('/', validate(createLeadSchema), leadsController.create);
leadsRouter.get('/', validate(leadQuerySchema, 'query'), leadsController.list);
leadsRouter.get('/export', validate(leadQuerySchema, 'query'), leadsController.exportCsv);
leadsRouter.get('/:id', validate(leadIdSchema, 'params'), leadsController.getById);
leadsRouter.patch(
  '/:id',
  validate(leadIdSchema, 'params'),
  validate(updateLeadSchema),
  leadsController.update,
);
leadsRouter.post(
  '/:id/activities',
  validate(leadIdSchema, 'params'),
  validate(leadActivitySchema),
  leadsController.addActivity,
);
