import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { leadsController } from './leads.controller.js';
import {
  createLeadSchema,
  followUpSchema,
  leadActivitySchema,
  leadIdSchema,
  leadQuerySchema,
  leadStatusSchema,
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
leadsRouter.get('/:id/activities', validate(leadIdSchema, 'params'), leadsController.listActivities);
leadsRouter.post(
  '/:id/status',
  validate(leadIdSchema, 'params'),
  validate(leadStatusSchema),
  leadsController.updateStatus,
);
leadsRouter.patch(
  '/:id/status',
  validate(leadIdSchema, 'params'),
  validate(leadStatusSchema),
  leadsController.updateStatus,
);
leadsRouter.post(
  '/:id/follow-up',
  validate(leadIdSchema, 'params'),
  validate(followUpSchema),
  leadsController.addFollowUp,
);
leadsRouter.patch(
  '/:id/follow-up',
  validate(leadIdSchema, 'params'),
  validate(followUpSchema),
  leadsController.addFollowUp,
);
