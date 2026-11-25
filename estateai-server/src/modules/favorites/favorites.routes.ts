import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { favoritesController } from './favorites.controller.js';
import { favoritePropertySchema } from './favorites.schema.js';

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get('/', favoritesController.list);
favoritesRouter.get('/:propertyId', validate(favoritePropertySchema, 'params'), favoritesController.check);
favoritesRouter.post('/:propertyId', validate(favoritePropertySchema, 'params'), favoritesController.add);
favoritesRouter.delete('/:propertyId', validate(favoritePropertySchema, 'params'), favoritesController.remove);
