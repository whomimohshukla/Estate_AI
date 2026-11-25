import { Router } from 'express';
import { z } from 'zod';
import { aiLimiter } from '../../middleware/rate-limit.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

import { descriptionsController } from './descriptions/descriptions.controller.js';
import { generateDescriptionSchema } from './descriptions/descriptions.schema.js';
import { embeddingsController } from './embeddings/embeddings.controller.js';
import { aiSearchController } from './search/search.controller.js';
import { aiSearchSchema } from './search/search.schema.js';

export const aiRouter = Router();

aiRouter.post('/search', aiLimiter, validate(aiSearchSchema), aiSearchController.search);
aiRouter.post(
  '/generate-description',
  aiLimiter,
  requireAuth,
  requireRole('AGENT', 'ADMIN'),
  validate(generateDescriptionSchema),
  descriptionsController.generate,
);
aiRouter.post(
  '/embeddings/reindex',
  aiLimiter,
  requireAuth,
  requireRole('ADMIN'),
  embeddingsController.reindex,
);
aiRouter.post(
  '/embeddings/:propertyId',
  aiLimiter,
  requireAuth,
  requireRole('AGENT', 'ADMIN'),
  validate(z.object({ propertyId: z.string().uuid() }), 'params'),
  embeddingsController.syncProperty,
);
