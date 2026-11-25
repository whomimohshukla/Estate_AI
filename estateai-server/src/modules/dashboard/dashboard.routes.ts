import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { dashboardController } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/agent', requireRole('AGENT', 'ADMIN'), dashboardController.agent);
dashboardRouter.get('/admin', requireRole('ADMIN'), dashboardController.admin);
dashboardRouter.get('/analytics', requireRole('ADMIN'), dashboardController.analytics);
