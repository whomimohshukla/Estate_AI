import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { favoritesRouter } from './modules/favorites/favorites.routes.js';
import { leadsRouter } from './modules/leads/leads.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { savedSearchesRouter } from './modules/saved-searches/saved-searches.routes.js';
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
  app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);
  app.use(requestContext);
  app.use(httpLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
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
  app.use(`${env.API_PREFIX}/favorites`, favoritesRouter);
  app.use(`${env.API_PREFIX}/saved-searches`, savedSearchesRouter);
  app.use(`${env.API_PREFIX}/leads`, leadsRouter);
  app.use(`${env.API_PREFIX}/notifications`, notificationsRouter);
  app.use(`${env.API_PREFIX}/reports`, reportsRouter);
  app.use(`${env.API_PREFIX}/dashboard`, dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
