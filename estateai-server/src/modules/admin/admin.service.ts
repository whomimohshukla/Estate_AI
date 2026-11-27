import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { paginationMeta, paginationSkipTake } from '../../utils/pagination.js';
import { BadRequestError, NotFoundError } from '../../utils/AppError.js';
import { authService } from '../auth/auth.service.js';
import type {
  AdminUserQueryInput,
  AdminUserRoleInput,
  AdminUserStatusInput,
  AuditLogQueryInput,
} from './admin.schema.js';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  isEmailVerified: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const adminService = {
  async listUsers(query: AdminUserQueryInput) {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = paginationSkipTake(query);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: query.sortOrder },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: paginationMeta(query, total) };
  },

  async updateUserStatus(actorId: string, id: string, input: AdminUserStatusInput) {
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new NotFoundError('User not found');
    if (actorId === id && !input.isActive) throw new BadRequestError('You cannot deactivate your own account');

    const updated = await prisma.user.update({ where: { id }, data: { isActive: input.isActive }, select: userSelect });

    if (!input.isActive) await authService.revokeAllSessions(id);
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: input.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'USER',
        entityId: id,
        metadata: { previousStatus: user.isActive, nextStatus: input.isActive },
      },
    });

    return updated;
  },

  async updateUserRole(actorId: string, id: string, input: AdminUserRoleInput) {
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new NotFoundError('User not found');
    if (actorId === id) throw new BadRequestError('You cannot change your own role');

    const updated = await prisma.user.update({ where: { id }, data: { role: input.role }, select: userSelect });
    await authService.revokeAllSessions(id);
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_ROLE_CHANGED',
        entityType: 'USER',
        entityId: id,
        metadata: { previousRole: user.role, nextRole: input.role },
      },
    });

    return updated;
  },

  async listAuditLogs(query: AuditLogQueryInput) {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entityType) where.entityType = { contains: query.entityType, mode: 'insensitive' };

    const { skip, take } = paginationSkipTake(query);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          userId: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: query.sortOrder },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({ ...log, actorId: log.userId })),
      meta: paginationMeta(query, total),
    };
  },
};
