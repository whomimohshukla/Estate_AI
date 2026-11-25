import { Prisma, type User } from '@prisma/client';
import { prisma } from '../../config/database.js';

type DbClient = typeof prisma | Prisma.TransactionClient;

export const authRepository = {
  findByEmail(email: string, client: DbClient = prisma): Promise<User | null> {
    return client.user.findUnique({ where: { email } });
  },

  findById(id: string, client: DbClient = prisma): Promise<User | null> {
    return client.user.findUnique({ where: { id } });
  },

  createUser(
    data: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: 'BUYER' | 'AGENT';
    },
    client: DbClient = prisma,
  ): Promise<User> {
    return client.user.create({ data });
  },

  updateLastLogin(id: string, client: DbClient = prisma): Promise<User> {
    return client.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },

  updatePassword(id: string, passwordHash: string, client: DbClient = prisma): Promise<User> {
    return client.user.update({ where: { id }, data: { passwordHash } });
  },

  createRefreshToken(
    data: {
      id?: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      ipAddress?: string;
      userAgent?: string;
    },
    client: DbClient = prisma,
  ) {
    return client.refreshToken.create({ data });
  },

  findRefreshToken(tokenHash: string, client: DbClient = prisma) {
    return client.refreshToken.findUnique({ where: { tokenHash } });
  },

  revokeRefreshToken(id: string, replacedBy: string | null, client: DbClient = prisma) {
    return client.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedBy },
    });
  },

  revokeAllRefreshTokens(userId: string, client: DbClient = prisma) {
    return client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  createPasswordResetToken(
    data: { userId: string; tokenHash: string; expiresAt: Date },
    client: DbClient = prisma,
  ) {
    return client.passwordResetToken.create({ data });
  },

  findPasswordResetToken(tokenHash: string, client: DbClient = prisma) {
    return client.passwordResetToken.findUnique({ where: { tokenHash } });
  },

  consumePasswordResetToken(id: string, client: DbClient = prisma) {
    return client.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  createEmailVerificationToken(
    data: { userId: string; tokenHash: string; expiresAt: Date },
    client: DbClient = prisma,
  ) {
    return client.emailVerificationToken.create({ data });
  },

  findEmailVerificationToken(tokenHash: string, client: DbClient = prisma) {
    return client.emailVerificationToken.findUnique({ where: { tokenHash } });
  },

  consumeEmailVerificationToken(id: string, client: DbClient = prisma) {
    return client.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  markEmailVerified(userId: string, client: DbClient = prisma): Promise<User> {
    return client.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
  },
};
