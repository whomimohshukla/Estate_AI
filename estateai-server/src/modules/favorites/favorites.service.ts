import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/AppError.js';
import { propertyRepository } from '../properties/properties.repository.js';
import { toPropertyDto } from '../properties/properties.types.js';

export const favoritesService = {
  async add(userId: string, propertyId: string) {
    const property = await propertyRepository.findById(propertyId);
    if (!property || property.status !== 'AVAILABLE') throw new NotFoundError('Property not found');

    return prisma.favorite.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      create: { userId, propertyId },
      update: {},
    });
  },

  async remove(userId: string, propertyId: string): Promise<void> {
    const result = await prisma.favorite.deleteMany({ where: { userId, propertyId } });
    if (result.count === 0) throw new NotFoundError('Favorite not found');
  },

  async list(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { property: { include: { images: { orderBy: { position: 'asc' } } } } },
    });

    return favorites
      .filter((favorite) => favorite.property.status === 'AVAILABLE')
      .map((favorite) => toPropertyDto(favorite.property));
  },

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    return Boolean(favorite);
  },
};
