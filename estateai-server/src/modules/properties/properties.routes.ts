import { Router } from 'express';
import { propertyImageUpload } from '../../config/upload.js';
import { optionalAuth, requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { propertiesController } from './properties.controller.js';
import {
  createPropertySchema,
  imageIdSchema,
  imageOrderSchema,
  propertyIdSchema,
  propertyQuerySchema,
  statusUpdateSchema,
  updatePropertySchema,
} from './properties.schema.js';

export const propertiesRouter = Router();

propertiesRouter.get('/', validate(propertyQuerySchema, 'query'), propertiesController.list);
propertiesRouter.post(
  '/',
  requireAuth,
  requireRole('AGENT'),
  validate(createPropertySchema),
  propertiesController.create,
);
propertiesRouter.get('/:id', optionalAuth, validate(propertyIdSchema, 'params'), propertiesController.getById);
propertiesRouter.patch(
  '/:id',
  requireAuth,
  requireRole('AGENT'),
  validate(propertyIdSchema, 'params'),
  validate(updatePropertySchema),
  propertiesController.update,
);
propertiesRouter.delete(
  '/:id',
  requireAuth,
  requireRole('AGENT'),
  validate(propertyIdSchema, 'params'),
  propertiesController.archive,
);
propertiesRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('AGENT'),
  validate(propertyIdSchema, 'params'),
  validate(statusUpdateSchema),
  propertiesController.changeStatus,
);
propertiesRouter.post(
  '/:id/images',
  requireAuth,
  requireRole('AGENT'),
  validate(propertyIdSchema, 'params'),
  propertyImageUpload.single('image'),
  propertiesController.uploadImage,
);
propertiesRouter.patch(
  '/:id/images/order',
  requireAuth,
  requireRole('AGENT'),
  validate(propertyIdSchema, 'params'),
  validate(imageOrderSchema),
  propertiesController.reorderImages,
);
propertiesRouter.patch(
  '/:id/images/:imageId/cover',
  requireAuth,
  requireRole('AGENT'),
  validate(imageIdSchema, 'params'),
  propertiesController.setCoverImage,
);
propertiesRouter.delete(
  '/:id/images/:imageId',
  requireAuth,
  requireRole('AGENT'),
  validate(imageIdSchema, 'params'),
  propertiesController.deleteImage,
);
