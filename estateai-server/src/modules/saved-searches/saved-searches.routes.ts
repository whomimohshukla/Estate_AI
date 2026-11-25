import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { savedSearchesController } from './saved-searches.controller.js';
import {
  savedSearchIdSchema,
  savedSearchSchema,
  savedSearchUpdateSchema,
  searchHistoryQuerySchema,
} from './saved-searches.schema.js';

export const savedSearchesRouter = Router();

savedSearchesRouter.use(requireAuth);

savedSearchesRouter.post('/', validate(savedSearchSchema), savedSearchesController.create);
savedSearchesRouter.get('/', savedSearchesController.list);
savedSearchesRouter.get('/history', validate(searchHistoryQuerySchema, 'query'), savedSearchesController.listHistory);
savedSearchesRouter.delete('/history', savedSearchesController.clearHistory);
savedSearchesRouter.patch(
  '/:id',
  validate(savedSearchIdSchema, 'params'),
  validate(savedSearchUpdateSchema),
  savedSearchesController.update,
);
savedSearchesRouter.delete('/:id', validate(savedSearchIdSchema, 'params'), savedSearchesController.remove);
