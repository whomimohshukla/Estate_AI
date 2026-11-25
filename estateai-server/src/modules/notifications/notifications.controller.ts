import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { validatedQuery } from '../../utils/validated-query.js';
import type { NotificationQueryInput } from './notifications.schema.js';
import { notificationsService } from './notifications.service.js';

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { notifications, meta } = await notificationsService.list(
      req.user!.id,
      validatedQuery<NotificationQueryInput>(req),
    );
    return success(res, { notifications }, 'Notifications retrieved', 200, meta);
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationsService.unreadCount(req.user!.id);
    return success(res, { count }, 'Unread count retrieved');
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationsService.markRead(req.user!.id, req.params.id!);
    return success(res, { notification }, 'Notification marked as read');
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const updated = await notificationsService.markAllRead(req.user!.id);
    return success(res, { updated }, 'All notifications marked as read');
  }),
};
