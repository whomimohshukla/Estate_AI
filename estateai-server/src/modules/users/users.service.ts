import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/AppError.js';
import { toSafeUser } from '../auth/auth.types.js';
import type { UpdateProfileInput } from './users.schema.js';

export const usersService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    return toSafeUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({ where: { id: userId }, data: input });
    return toSafeUser(user);
  },
};
