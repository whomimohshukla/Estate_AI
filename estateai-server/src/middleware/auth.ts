import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../config/database.js';
import {
  isAccessTokenDenied,
  isUserTokenRevokedBefore,
} from '../config/redis.js';
import { UnauthorizedError, ForbiddenError } from '../utils/AppError.js';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js';
import { asyncHandler } from '../utils/async-handler.js';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

export function extractAccessToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies?.[ACCESS_COOKIE]) return req.cookies[ACCESS_COOKIE] as string;
  return null;
}

async function assertTokenNotRevoked(payload: AccessTokenPayload): Promise<void> {
  if (payload.jti && (await isAccessTokenDenied(payload.jti))) {
    throw new UnauthorizedError('Session has been revoked');
  }

  if (payload.iat !== undefined && (await isUserTokenRevokedBefore(payload.sub, payload.iat))) {
    throw new UnauthorizedError('Session has been revoked');
  }
}

async function authenticatedUser(req: Request) {
  const token = extractAccessToken(req);
  if (!token) return null;

  const payload = verifyAccessToken(token);
  await assertTokenNotRevoked(payload);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const user = await authenticatedUser(req);
    if (user) req.user = { id: user.id, email: user.email, role: user.role };
  } catch {
    req.user = undefined;
  }

  next();
});

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!extractAccessToken(req)) throw new UnauthorizedError('Authentication required');

  const user = await authenticatedUser(req);
  if (!user) throw new UnauthorizedError('Account is inactive or no longer exists');

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
});

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Your role cannot perform this action'));
      return;
    }

    next();
  };
}
