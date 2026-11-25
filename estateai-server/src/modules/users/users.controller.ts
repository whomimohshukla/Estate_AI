import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { success } from '../../utils/api-response.js';
import { usersService } from './users.service.js';
import type { UpdateProfileInput } from './users.schema.js';

export const usersController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.getProfile(req.user!.id);
    return success(res, { user }, 'Profile retrieved');
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.updateProfile(req.user!.id, req.body as UpdateProfileInput);
    return success(res, { user }, 'Profile updated');
  }),
};
