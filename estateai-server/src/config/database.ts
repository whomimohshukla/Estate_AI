import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from './logger.js';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? [{ emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }] : [],
});

prisma.$on('error', (event) => {
  logger.error({ err: event }, 'Prisma query error');
});

prisma.$on('warn', (event) => {
  logger.warn({ msg: event.message }, 'Prisma warning');
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
