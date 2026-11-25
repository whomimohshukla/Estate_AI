import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
authRouter.post('/logout', authLimiter, authController.logout);
authRouter.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
authRouter.post('/verify-email', authLimiter, validate(verifyEmailSchema), authController.verifyEmail);
authRouter.get('/verify-email', authLimiter, validate(verifyEmailSchema, 'query'), authController.verifyEmail);
authRouter.get('/me', requireAuth, authController.me);
authRouter.patch('/password', authLimiter, requireAuth, validate(changePasswordSchema), authController.changePassword);
