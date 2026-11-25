import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { moderationSchema, propertyIdSchema, propertyQuerySchema } from '../properties/properties.schema.js';
import { adminController } from './admin.controller.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));
adminRouter.get('/properties', validate(propertyQuerySchema, 'query'), adminController.listProperties);
adminRouter.get('/properties/pending', validate(propertyQuerySchema, 'query'), adminController.listPending);
adminRouter.patch('/properties/:id/approve', validate(propertyIdSchema, 'params'), adminController.approve);
adminRouter.patch(
  '/properties/:id/reject',
  validate(propertyIdSchema, 'params'),
  validate(moderationSchema),
  adminController.reject,
);
adminRouter.patch(
  '/properties/:id/request-correction',
  validate(propertyIdSchema, 'params'),
  validate(moderationSchema),
  adminController.requestCorrection,
);
