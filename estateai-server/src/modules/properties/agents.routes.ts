import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { propertiesController } from './properties.controller.js';
import { propertyQuerySchema } from './properties.schema.js';

export const agentsRouter = Router();

agentsRouter.use(requireAuth, requireRole('AGENT'));
agentsRouter.get('/me/properties', validate(propertyQuerySchema, 'query'), propertiesController.listMine);
