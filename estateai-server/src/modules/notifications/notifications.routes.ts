import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { notificationsController } from './notifications.controller.js';
import { notificationIdSchema, notificationQuerySchema } from './notifications.schema.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', validate(notificationQuerySchema, 'query'), notificationsController.list);
notificationsRouter.get('/unread-count', notificationsController.unreadCount);
notificationsRouter.patch('/read-all', notificationsController.markAllRead);
notificationsRouter.patch('/:id', validate(notificationIdSchema, 'params'), notificationsController.markRead);
