import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let client: Redis | null = null;
let unavailable = false;

export function getRedis(): Redis | null {
  if (!env.REDIS_URL || unavailable) return null;

  if (!client) {
    client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });

    client.on('error', (error) => {
      unavailable = true;
      logger.warn({ err: error }, 'Redis unavailable; continuing without cache');
    });
  }

  return client;
}

export async function connectRedis(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.connect();
    return true;
  } catch {
    unavailable = true;
    logger.warn('Redis connection failed; continuing without cache');
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client?.status === 'ready' || client?.status === 'connecting') {
    await client.quit();
  }
  client = null;
  unavailable = false;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis || redis.status !== 'ready') return null;

  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const redis = getRedis();
  if (!redis || redis.status !== 'ready') return;

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    logger.warn({ key }, 'Failed to write cache key');
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis || redis.status !== 'ready') return;

  try {
    await redis.del(key);
  } catch {
    logger.warn({ key }, 'Failed to delete cache key');
  }
}

const ACCESS_DENY_PREFIX = 'auth:access-denied:';
const USER_REVOKE_PREFIX = 'auth:user-revoked-before:';

export async function denyAccessToken(jti: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis || redis.status !== 'ready') return;

  try {
    await redis.set(`${ACCESS_DENY_PREFIX}${jti}`, '1', 'EX', Math.max(1, ttlSeconds));
  } catch {
    logger.warn({ jti }, 'Failed to deny access token');
  }
}

export async function isAccessTokenDenied(jti: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis || redis.status !== 'ready') return false;

  try {
    return (await redis.exists(`${ACCESS_DENY_PREFIX}${jti}`)) === 1;
  } catch {
    return false;
  }
}

export async function revokeUserTokensBefore(
  userId: string,
  issuedAtSeconds: number,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis || redis.status !== 'ready') return;

  const key = `${USER_REVOKE_PREFIX}${userId}`;

  try {
    const current = await redis.get(key);
    if (current === null || issuedAtSeconds > Number(current)) {
      await redis.set(key, String(issuedAtSeconds), 'EX', Math.max(1, ttlSeconds));
    }
  } catch {
    logger.warn({ userId }, 'Failed to revoke user access tokens');
  }
}

export async function isUserTokenRevokedBefore(userId: string, issuedAtSeconds: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis || redis.status !== 'ready') return false;

  try {
    const revokedBefore = await redis.get(`${USER_REVOKE_PREFIX}${userId}`);
    return revokedBefore !== null && issuedAtSeconds < Number(revokedBefore);
  } catch {
    return false;
  }
}
