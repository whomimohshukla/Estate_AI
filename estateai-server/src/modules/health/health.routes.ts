import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { getRedis } from '../../config/redis.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    return success(res, { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }, 'Service is healthy');
  }),
);

healthRouter.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    const redis = getRedis();

    return success(
      res,
      {
        database: 'ok',
        redis: redis?.status === 'ready' ? 'ok' : 'unavailable',
      },
      'Service is ready',
    );
  }),
);
