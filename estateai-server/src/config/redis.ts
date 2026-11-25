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
