import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

async function start(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'EstateAI server started');
  });

  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Shutting down server');
    server.close(async () => {
      await disconnectRedis();
      await disconnectDatabase();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

start().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
