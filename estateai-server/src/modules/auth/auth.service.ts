import { randomUUID } from 'node:crypto';
import { sendEmail } from '../../config/mailer.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../utils/AppError.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import {
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { generateToken, hashToken } from '../../utils/tokens.js';
import { authRepository } from './auth.repository.js';
import { toSafeUser, type AuthResult } from './auth.types.js';
import type { ChangePasswordInput, LoginInput, RegisterInput } from './auth.schema.js';
import type { User } from '@prisma/client';

export interface TokenMeta {
  ipAddress?: string;
  userAgent?: string;
}

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeMs,
  };
}

export const authCookies = {
  access: () => cookieOptions(parseDurationMs(env.JWT_ACCESS_EXPIRES_IN)),
  refresh: () => cookieOptions(parseDurationMs(env.JWT_REFRESH_EXPIRES_IN)),
  clear: () => ({ ...cookieOptions(0), maxAge: 0 }),
};

function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 15 * 60_000;
  const amount = Number(match[1]);
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return amount * units[match[2] as keyof typeof units];
}

async function issueTokens(user: User, meta: TokenMeta): Promise<AuthResult> {
  const tokenId = randomUUID();
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenId });

  await authRepository.createRefreshToken({
    id: tokenId,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshTokenExpiry(),
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { user: toSafeUser(user), accessToken, refreshToken };
}

async function sendVerificationEmail(user: User): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);

  await authRepository.createEmailVerificationToken({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const link = `${env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your EstateAI account',
    text: `Verify your email address: ${link}`,
    devLink: link,
  });
}

export const authService = {
  async register(input: RegisterInput, meta: TokenMeta): Promise<AuthResult> {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
    });

    await sendVerificationEmail(user);
    return issueTokens(user, meta);
  },

  async login(input: LoginInput, meta: TokenMeta): Promise<AuthResult> {
    const user = await authRepository.findByEmail(input.email);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid email or password');

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedError('Invalid email or password');

    const updatedUser = await authRepository.updateLastLogin(user.id);
    return issueTokens(updatedUser, meta);
  },

  async refresh(token: string, meta: TokenMeta): Promise<AuthResult> {
    const payload = verifyRefreshToken(token);
    const tokenHash = hashToken(token);
    const stored = await authRepository.findRefreshToken(tokenHash);

    if (!stored) throw new UnauthorizedError('Invalid refresh token');

    if (stored.revokedAt) {
      await authRepository.revokeAllRefreshTokens(stored.userId);
      throw new UnauthorizedError('Refresh token reuse detected; all sessions revoked');
    }

    if (stored.expiresAt.getTime() < Date.now()) throw new UnauthorizedError('Refresh token has expired');

    const user = await authRepository.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('Account is inactive or no longer exists');

    const newTokenId = randomUUID();
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, tokenId: newTokenId });

    await prisma.$transaction(async (tx) => {
      await authRepository.revokeRefreshToken(stored.id, newTokenId, tx);
      await authRepository.createRefreshToken(
        {
          id: newTokenId,
          userId: user.id,
          tokenHash: hashToken(refreshToken),
          expiresAt: getRefreshTokenExpiry(),
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
        tx,
      );
    });

    return { user: toSafeUser(user), accessToken, refreshToken };
  },

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;

    try {
      const stored = await authRepository.findRefreshToken(hashToken(token));
      if (stored && !stored.revokedAt) {
        await authRepository.revokeRefreshToken(stored.id, null);
      }
    } catch {
      return;
    }
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await authRepository.findByEmail(email);
    if (!user || !user.isActive) return;

    const token = generateToken();
    await authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60_000),
    });

    const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your EstateAI password',
      text: `Reset your password: ${link}`,
      devLink: link,
    });
  },

  async resetPassword(input: { token: string; password: string }): Promise<void> {
    const stored = await authRepository.findPasswordResetToken(hashToken(input.token));
    if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new BadRequestError('Reset link is invalid or has expired');
    }

    const passwordHash = await hashPassword(input.password);

    await prisma.$transaction(async (tx) => {
      await authRepository.updatePassword(stored.userId, passwordHash, tx);
      await authRepository.consumePasswordResetToken(stored.id, tx);
      await authRepository.revokeAllRefreshTokens(stored.userId, tx);
    });
  },

  async verifyEmail(token: string): Promise<void> {
    const stored = await authRepository.findEmailVerificationToken(hashToken(token));
    if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new BadRequestError('Verification link is invalid or has expired');
    }

    await prisma.$transaction(async (tx) => {
      await authRepository.markEmailVerified(stored.userId, tx);
      await authRepository.consumeEmailVerificationToken(stored.id, tx);
    });
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await authRepository.findById(userId);
    if (!user) throw new UnauthorizedError('Account not found');

    const matches = await comparePassword(input.currentPassword, user.passwordHash);
    if (!matches) throw new BadRequestError('Current password is incorrect');

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.$transaction(async (tx) => {
      await authRepository.updatePassword(userId, passwordHash, tx);
      await authRepository.revokeAllRefreshTokens(userId, tx);
    });
  },

  async getMe(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw new UnauthorizedError('Account not found');
    return toSafeUser(user);
  },
};
