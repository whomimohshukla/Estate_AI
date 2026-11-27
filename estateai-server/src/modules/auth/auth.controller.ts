import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { UnauthorizedError } from '../../utils/AppError.js';
import { validatedQuery } from '../../utils/validated-query.js';
import { ACCESS_COOKIE, REFRESH_COOKIE, extractAccessToken } from '../../middleware/auth.js';
import { authCookies, authService, type TokenMeta } from './auth.service.js';
import type { ChangePasswordInput, RegisterInput } from './auth.schema.js';

function tokenMeta(req: Request): TokenMeta {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, authCookies.access());
  res.cookie(REFRESH_COOKIE, refreshToken, authCookies.refresh());
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput, tokenMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return success(res, { user: result.user, accessToken: result.accessToken }, 'Account created successfully', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, tokenMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return success(res, { user: result.user, accessToken: result.accessToken }, 'Logged in successfully');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { token?: string };
    const token = req.cookies?.[REFRESH_COOKIE] ?? body.token;
    if (typeof token !== 'string' || token.length === 0) throw new UnauthorizedError('Refresh token required');

    const result = await authService.refresh(token, tokenMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return success(res, { user: result.user, accessToken: result.accessToken }, 'Session refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] ?? (req.body as { token?: string } | undefined)?.token;
    await authService.logout(typeof token === 'string' ? token : undefined, extractAccessToken(req) ?? undefined);

    res.clearCookie(ACCESS_COOKIE, authCookies.clear());
    res.clearCookie(REFRESH_COOKIE, authCookies.clear());
    return success(res, { loggedOut: true }, 'Logged out successfully');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    return success(res, { user }, 'Profile retrieved');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword((req.body as { email: string }).email);
    return success(res, { accepted: true }, 'If the account exists, a reset link has been sent');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    return success(res, { reset: true }, 'Password reset successfully');
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const token = (validatedQuery<{ token: string }>(req)).token ?? (req.body as { token?: string }).token;
    if (!token) throw new UnauthorizedError('Verification token required');

    await authService.verifyEmail(token);
    return success(res, { verified: true }, 'Email verified successfully');
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.user!.id, req.body as ChangePasswordInput);
    res.clearCookie(ACCESS_COOKIE, authCookies.clear());
    res.clearCookie(REFRESH_COOKIE, authCookies.clear());
    return success(res, { changed: true }, 'Password changed successfully');
  }),
};
