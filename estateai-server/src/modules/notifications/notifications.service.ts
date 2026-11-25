import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/AppError.js';
import { paginationMeta } from '../../utils/pagination.js';
import type { NotificationQueryInput } from './notifications.schema.js';

export const notificationsService = {
  async list(userId: string, query: NotificationQueryInput) {
    const where = { userId, ...(query.unreadOnly ? { isRead: false } : {}) };
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.notification.count({ where }),
    ]);
    return { notifications, meta: paginationMeta(query, total) };
  },

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundError('Notification not found');
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  },

  async markAllRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return result.count;
  },
};
