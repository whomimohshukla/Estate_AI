import type { NextFunction, Request, Response } from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from '../config/logger.js';
import { createRequestId } from '../utils/tokens.js';

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const headerId = req.headers['x-request-id'];
  req.requestId = typeof headerId === 'string' && headerId.length > 0 ? headerId : createRequestId();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as Request).requestId ?? createRequestId(),
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health' || req.url === '/health',
  },
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
