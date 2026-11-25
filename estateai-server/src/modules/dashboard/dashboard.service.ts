import { prisma } from '../../config/database.js';
import type { Viewer } from '../properties/properties.service.js';

function countBy<T extends string>(values: T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export const dashboardService = {
  async agent(viewer: Viewer) {
    const [properties, leads, favoriteCount, recentLeads] = await Promise.all([
      prisma.property.findMany({
        where: { agentId: viewer.id },
        select: { id: true, status: true, viewsCount: true },
      }),
      prisma.lead.findMany({ where: { agentId: viewer.id }, select: { status: true } }),
      prisma.favorite.count({ where: { property: { agentId: viewer.id } } }),
      prisma.lead.findMany({
        where: { agentId: viewer.id },
        include: {
          property: { select: { id: true, title: true } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      properties: {
        total: properties.length,
        byStatus: countBy(properties.map((property) => property.status)),
        totalViews: properties.reduce((sum, property) => sum + property.viewsCount, 0),
        favorites: favoriteCount,
      },
      leads: {
        total: leads.length,
        byStatus: countBy(leads.map((lead) => lead.status)),
        recent: recentLeads,
      },
    };
  },

  async admin() {
    const [users, properties, leads, reports, favorites, savedSearches, searches, notifications] = await Promise.all([
      prisma.user.findMany({ select: { role: true } }),
      prisma.property.findMany({ select: { status: true, viewsCount: true, createdAt: true } }),
      prisma.lead.findMany({ select: { status: true } }),
      prisma.propertyReport.findMany({ select: { status: true } }),
      prisma.favorite.count(),
      prisma.savedSearch.count(),
      prisma.searchHistory.count(),
      prisma.notification.count({ where: { isRead: false } }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recent = properties.filter((property) => property.createdAt >= sixMonthsAgo);

    return {
      users: { total: users.length, byRole: countBy(users.map((user) => user.role)) },
      properties: {
        total: properties.length,
        byStatus: countBy(properties.map((property) => property.status)),
        totalViews: properties.reduce((sum, property) => sum + property.viewsCount, 0),
        lastSixMonths: recent.length,
      },
      leads: { total: leads.length, byStatus: countBy(leads.map((lead) => lead.status)) },
      reports: { total: reports.length, byStatus: countBy(reports.map((report) => report.status)) },
      engagement: {
        favorites,
        savedSearches,
        searches,
        unreadNotifications: notifications,
      },
    };
  },
};
