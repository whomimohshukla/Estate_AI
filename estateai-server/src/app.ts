import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { agentsRouter } from './modules/properties/agents.routes.js';
import { propertiesRouter } from './modules/properties/properties.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { httpLogger, requestContext } from './middleware/request-context.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(httpLogger);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR), { maxAge: '7d', immutable: true }));
  app.use('/health', healthRouter);
  app.use(env.API_PREFIX, apiLimiter);
  app.use(`${env.API_PREFIX}/health`, healthRouter);
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/users`, usersRouter);
  app.use(`${env.API_PREFIX}/agents`, agentsRouter);
  app.use(`${env.API_PREFIX}/properties`, propertiesRouter);
  app.use(`${env.API_PREFIX}/admin`, adminRouter);
  app.use(`${env.API_PREFIX}/ai`, aiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
