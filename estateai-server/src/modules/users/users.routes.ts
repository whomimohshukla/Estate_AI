import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { usersController } from './users.controller.js';
import { updateProfileSchema } from './users.schema.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get('/me', usersController.getMe);
usersRouter.patch('/me', validate(updateProfileSchema), usersController.updateMe);
