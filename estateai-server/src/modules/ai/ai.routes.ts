import { Router } from 'express';
import { z } from 'zod';
import { aiLimiter } from '../../middleware/rate-limit.js';
import { optionalAuth, requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

import { chatController } from './chatbot/chat.controller.js';
import { chatSchema } from './chatbot/chat.schema.js';
import { comparisonController } from './comparison/comparison.controller.js';
import { compareSchema } from './comparison/comparison.schema.js';
import { descriptionsController } from './descriptions/descriptions.controller.js';
import { generateDescriptionSchema } from './descriptions/descriptions.schema.js';
import { embeddingsController } from './embeddings/embeddings.controller.js';
import { leadAssistantController } from './lead-assistant/lead-assistant.controller.js';
import { leadAssistantSchema } from './lead-assistant/lead-assistant.schema.js';
import { aiSearchController } from './search/search.controller.js';
import { aiSearchSchema } from './search/search.schema.js';

export const aiRouter = Router();

aiRouter.post('/search', aiLimiter, optionalAuth, validate(aiSearchSchema), aiSearchController.search);
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
aiRouter.post('/chat', aiLimiter, requireAuth, validate(chatSchema), chatController.chat);
aiRouter.get('/conversations', requireAuth, chatController.list);
aiRouter.get(
  '/conversations/:id',
  requireAuth,
  validate(z.object({ id: z.string().uuid() }), 'params'),
  chatController.getById,
);
aiRouter.delete(
  '/conversations/:id',
  requireAuth,
  validate(z.object({ id: z.string().uuid() }), 'params'),
  chatController.remove,
);
aiRouter.post('/compare', aiLimiter, optionalAuth, validate(compareSchema), comparisonController.compare);
aiRouter.get('/comparisons', requireAuth, comparisonController.listSaved);
aiRouter.post(
  '/lead-assistant',
  aiLimiter,
  requireAuth,
  requireRole('AGENT', 'ADMIN'),
  validate(leadAssistantSchema),
  leadAssistantController.assist,
);
