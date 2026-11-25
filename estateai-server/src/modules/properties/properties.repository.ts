import { Prisma, type Property, type PropertyImage, type PropertyStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { paginationSkipTake } from '../../utils/pagination.js';
import type { CreatePropertyInput, PropertyQueryInput, UpdatePropertyInput } from './properties.schema.js';

const propertyWithImages = Prisma.validator<Prisma.PropertyDefaultArgs>()({ include: { images: { orderBy: { position: 'asc' } } } });
export type PropertyWithImages = Prisma.PropertyGetPayload<typeof propertyWithImages>;

type DbClient = typeof prisma | Prisma.TransactionClient;

function buildWhere(query: PropertyQueryInput, options: { agentId?: string; statuses?: PropertyStatus[] }): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  if (options.statuses?.length) {
    where.status = { in: options.statuses };
  } else if (!options.agentId) {
    where.status = 'AVAILABLE';
  }

  if (options.agentId) where.agentId = options.agentId;
  if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
  if (query.locality) where.locality = { contains: query.locality, mode: 'insensitive' };
  if (query.propertyType) where.propertyType = query.propertyType;
  if (query.purpose) where.purpose = query.purpose;
  if (query.minPrice !== undefined) where.price = { ...(where.price as object), gte: query.minPrice };
  if (query.maxPrice !== undefined) where.price = { ...(where.price as object), lte: query.maxPrice };
  if (query.bedrooms !== undefined) where.bedrooms = query.bedrooms;
  if (query.bathrooms !== undefined) where.bathrooms = query.bathrooms;
  if (query.minArea !== undefined) where.areaSqFt = { ...(where.areaSqFt as object), gte: query.minArea };
  if (query.maxArea !== undefined) where.areaSqFt = { ...(where.areaSqFt as object), gte: query.minArea, lte: query.maxArea };
  if (query.amenities?.length) where.amenities = { hasEvery: query.amenities };
  if (query.parking !== undefined) where.parking = query.parking;
  if (query.furnishing) where.furnishing = query.furnishing;

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { locality: { contains: query.q, mode: 'insensitive' } },
      { city: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  return where;
}

function buildOrderBy(query: PropertyQueryInput): Prisma.PropertyOrderByWithRelationInput {
  switch (query.sortBy) {
    case 'price':
      return { price: query.sortOrder };
    case 'areaSqFt':
      return { areaSqFt: query.sortOrder };
    case 'bedrooms':
      return { bedrooms: query.sortOrder };
    default:
      return { createdAt: query.sortOrder };
  }
}

async function nearbyPropertyIds(query: PropertyQueryInput): Promise<string[] | undefined> {
  if (query.latitude === undefined || query.longitude === undefined || query.radiusKm === undefined) {
    return undefined;
  }

  if (query.latitude === null || query.longitude === null) return undefined;

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Property"
    WHERE "status" = 'AVAILABLE'
      AND "latitude" IS NOT NULL
      AND "longitude" IS NOT NULL
      AND (
        6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(${query.latitude})) * cos(radians("latitude"::double precision)) *
            cos(radians("longitude"::double precision) - radians(${query.longitude})) +
            sin(radians(${query.latitude})) * sin(radians("latitude"::double precision))
          ))
        )
      ) <= ${query.radiusKm}
  `;

  return rows.map((row) => row.id);
}

export const propertyRepository = {
  async findMany(
    query: PropertyQueryInput,
    options: { agentId?: string; statuses?: PropertyStatus[] } = {},
  ): Promise<PropertyWithImages[]> {
    const where = buildWhere(query, options);
    const nearbyIds = await nearbyPropertyIds(query);
    if (nearbyIds) where.id = { in: nearbyIds };

    const { skip, take } = paginationSkipTake(query);
    return prisma.property.findMany({
      where,
      include: { images: { orderBy: { position: 'asc' } } },
      orderBy: [buildOrderBy(query), { id: 'asc' }],
      skip,
      take,
    });
  },

  async count(
    query: PropertyQueryInput,
    options: { agentId?: string; statuses?: PropertyStatus[] } = {},
  ): Promise<number> {
    const where = buildWhere(query, options);
    const nearbyIds = await nearbyPropertyIds(query);
    if (nearbyIds) where.id = { in: nearbyIds };
    return prisma.property.count({ where });
  },

  findById(id: string, client: DbClient = prisma): Promise<PropertyWithImages | null> {
    return client.property.findUnique({
      where: { id },
      include: { images: { orderBy: { position: 'asc' } } },
    });
  },

  create(agentId: string, data: CreatePropertyInput, client: DbClient = prisma): Promise<Property> {
    return client.property.create({ data: { ...data, agentId, status: 'DRAFT' } });
  },

  update(id: string, data: UpdatePropertyInput, client: DbClient = prisma): Promise<Property> {
    return client.property.update({ where: { id }, data });
  },

  updateStatus(
    id: string,
    status: PropertyStatus,
    data: { rejectionReason?: string | null; publishedAt?: Date | null; archivedAt?: Date | null } = {},
    client: DbClient = prisma,
  ): Promise<Property> {
    return client.property.update({ where: { id }, data: { status, ...data } });
  },

  findImages(propertyId: string, client: DbClient = prisma): Promise<PropertyImage[]> {
    return client.propertyImage.findMany({ where: { propertyId }, orderBy: { position: 'asc' } });
  },

  findImage(propertyId: string, imageId: string, client: DbClient = prisma): Promise<PropertyImage | null> {
    return client.propertyImage.findFirst({ where: { id: imageId, propertyId } });
  },

  createImage(
    propertyId: string,
    data: { url: string; publicId?: string; altText?: string; position: number; isCover: boolean },
    client: DbClient = prisma,
  ): Promise<PropertyImage> {
    return client.propertyImage.create({ data: { ...data, propertyId } });
  },

  deleteImage(imageId: string, client: DbClient = prisma): Promise<PropertyImage> {
    return client.propertyImage.delete({ where: { id: imageId } });
  },

  async setCoverImage(propertyId: string, imageId: string, client: DbClient = prisma): Promise<void> {
    await client.propertyImage.updateMany({ where: { propertyId }, data: { isCover: false } });
    await client.propertyImage.update({ where: { id: imageId }, data: { isCover: true } });
  },

  async setImageOrder(propertyId: string, imageIds: string[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const [position, imageId] of imageIds.entries()) {
        await tx.propertyImage.update({
          where: { id: imageId, propertyId },
          data: { position },
        });
      }
    }, { timeout: 10_000 });
  },
};
