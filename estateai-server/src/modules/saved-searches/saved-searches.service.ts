import type { Property } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/AppError.js';
import { propertyQuerySchema } from '../properties/properties.schema.js';
import type { SavedSearchInput, SavedSearchUpdateInput } from './saved-searches.schema.js';

function matchesFilters(property: Property, filters: unknown): boolean {
  const parsed = propertyQuerySchema.partial().safeParse(filters);
  if (!parsed.success) return false;
  const query = parsed.data;

  if (query.city && !property.city.toLowerCase().includes(query.city.toLowerCase())) return false;
  if (query.locality && !property.locality.toLowerCase().includes(query.locality.toLowerCase())) return false;
  if (query.propertyType && property.propertyType !== query.propertyType) return false;
  if (query.purpose && property.purpose !== query.purpose) return false;
  if (query.minPrice !== undefined && Number(property.price) < query.minPrice) return false;
  if (query.maxPrice !== undefined && Number(property.price) > query.maxPrice) return false;
  if (query.bedrooms !== undefined && property.bedrooms !== query.bedrooms) return false;
  if (query.bathrooms !== undefined && property.bathrooms !== query.bathrooms) return false;
  if (query.minArea !== undefined && property.areaSqFt < query.minArea) return false;
  if (query.maxArea !== undefined && property.areaSqFt > query.maxArea) return false;
  if (query.parking !== undefined && property.parking !== query.parking) return false;
  if (query.furnishing && property.furnishing !== query.furnishing) return false;
  if (query.amenities?.length && !query.amenities.every((amenity) => property.amenities.includes(amenity))) {
    return false;
  }

  if (query.q) {
    const searchable = [property.title, property.description, property.locality, property.city].join(' ').toLowerCase();
    if (!searchable.includes(query.q.toLowerCase())) return false;
  }

  if (
    query.latitude !== undefined &&
    query.longitude !== undefined &&
    query.radiusKm !== undefined &&
    property.latitude !== null &&
    property.longitude !== null
  ) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const latitude = Number(property.latitude);
    const longitude = Number(property.longitude);
    const distance =
      6371 *
      Math.acos(
        Math.min(
          1,
          Math.max(
            -1,
            Math.cos(toRadians(query.latitude)) * Math.cos(toRadians(latitude)) *
              Math.cos(toRadians(longitude) - toRadians(query.longitude)) +
              Math.sin(toRadians(query.latitude)) * Math.sin(toRadians(latitude)),
          ),
        ),
      );
    if (distance > query.radiusKm) return false;
  }

  return true;
}

export const savedSearchesService = {
  async create(userId: string, input: SavedSearchInput) {
    return prisma.savedSearch.create({
      data: {
        userId,
        name: input.name,
        query: input.query,
        filters: input.filters,
        notify: input.notify,
      },
    });
  },

  async list(userId: string) {
    return prisma.savedSearch.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  },

  async update(userId: string, id: string, input: SavedSearchUpdateInput) {
    const savedSearch = await prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!savedSearch) throw new NotFoundError('Saved search not found');

    return prisma.savedSearch.update({
      where: { id },
      data: {
        name: input.name,
        query: input.query,
        filters: input.filters,
        notify: input.notify,
      },
    });
  },

  async remove(userId: string, id: string): Promise<void> {
    const savedSearch = await prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!savedSearch) throw new NotFoundError('Saved search not found');
    await prisma.savedSearch.delete({ where: { id } });
  },

  async recordHistory(userId: string, query: string, filters: unknown, resultCount: number) {
    return prisma.searchHistory.create({
      data: { userId, query, filters: filters as object, resultCount },
    });
  },

  async listHistory(userId: string, limit: number) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async clearHistory(userId: string): Promise<number> {
    const result = await prisma.searchHistory.deleteMany({ where: { userId } });
    return result.count;
  },

  async notifyMatches(property: Property): Promise<number> {
    const savedSearches = await prisma.savedSearch.findMany({ where: { notify: true } });
    const matches = savedSearches.filter((savedSearch) => matchesFilters(property, savedSearch.filters));

    if (matches.length) {
      await prisma.notification.createMany({
        data: matches.map((savedSearch) => ({
          userId: savedSearch.userId,
          type: 'SAVED_SEARCH_MATCH' as const,
          title: 'New listing matches your saved search',
          body: `${property.title} in ${property.locality}, ${property.city}`,
          data: { propertyId: property.id, savedSearchId: savedSearch.id },
        })),
      });
    }

    return matches.length;
  },
};
