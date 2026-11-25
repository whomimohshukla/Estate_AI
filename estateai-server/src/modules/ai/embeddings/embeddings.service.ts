import { createHash, randomUUID } from 'node:crypto';
import { Prisma, type Property } from '@prisma/client';
import { embedTexts } from '../../../config/gemini.js';
import { prisma } from '../../../config/database.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';

export const EMBEDDING_DIMENSIONS = 768;

function fallbackEmbedding(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1);

  for (const token of tokens) {
    const digest = createHash('sha256').update(token).digest();
    for (let byte = 0; byte < 16; byte += 1) {
      const index = ((digest[byte] ?? 0) * 256 + (digest[byte + 1] ?? 0)) % EMBEDDING_DIMENSIONS;
      vector[index] = (vector[index] ?? 0) + 1;
    }
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

function toVectorLiteral(values: number[]): string {
  return `[${values.map((value) => value.toFixed(6)).join(',')}]`;
}

export function propertySearchText(property: Property): string {
  return [
    property.title,
    property.description,
    property.city,
    property.locality,
    property.state,
    property.propertyType,
    property.purpose,
    `${property.bedrooms} bedrooms`,
    `${property.bathrooms} bathrooms`,
    `${property.areaSqFt} square feet`,
    `price ${property.price.toString()}`,
    property.amenities.join(' '),
    property.furnishing,
    property.parking ? 'parking available' : '',
  ]
    .filter(Boolean)
    .join('. ');
}

function contentHash(text: string): string {
  return createHash('sha256').update(`${env.GEMINI_EMBEDDING_MODEL}:${text}`).digest('hex');
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const remote = await embedTexts(texts);
  if (remote && remote.every((vector) => vector.length === EMBEDDING_DIMENSIONS)) return remote;
  if (remote) {
    logger.warn('Gemini embedding dimensions did not match schema; using local embeddings');
  }
  return texts.map(fallbackEmbedding);
}

export const embeddingsService = {
  async syncProperty(property: Property): Promise<boolean> {
    const text = propertySearchText(property);
    const hash = contentHash(text);

    const existing = await prisma.propertyEmbedding.findUnique({ where: { propertyId: property.id } });
    if (existing?.contentHash === hash && existing.model === env.GEMINI_EMBEDDING_MODEL) return false;

    const [vector] = await generateEmbeddings([text]);
    if (!vector) return false;

    await prisma.$executeRaw`
      INSERT INTO "PropertyEmbedding" ("id", "propertyId", "embedding", "contentHash", "model", "createdAt", "updatedAt")
      VALUES (
        ${randomUUID()}::uuid,
        ${property.id}::uuid,
        ${toVectorLiteral(vector)}::vector,
        ${hash},
        ${env.GEMINI_EMBEDDING_MODEL},
        NOW(),
        NOW()
      )
      ON CONFLICT ("propertyId") DO UPDATE SET
        "embedding" = EXCLUDED."embedding",
        "contentHash" = EXCLUDED."contentHash",
        "model" = EXCLUDED."model",
        "updatedAt" = NOW()
      WHERE "PropertyEmbedding"."contentHash" <> EXCLUDED."contentHash"
    `;

    return true;
  },

  async syncMany(properties: Property[]): Promise<number> {
    let synced = 0;
    for (const property of properties) {
      if (await this.syncProperty(property)) synced += 1;
    }
    return synced;
  },

  async reindexAll(): Promise<number> {
    const properties = await prisma.property.findMany({
      where: { status: { in: ['AVAILABLE', 'PENDING'] } },
      take: 500,
      orderBy: { updatedAt: 'desc' },
    });
    return this.syncMany(properties);
  },

  async embedQuery(query: string): Promise<number[]> {
    const [vector] = await generateEmbeddings([query]);
    return vector ?? fallbackEmbedding(query);
  },

  async rank(propertyIds: string[], queryVector: number[], limit: number): Promise<Array<{ id: string; similarity: number }>> {
    if (propertyIds.length === 0) return [];

    const rows = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>(Prisma.sql`
      SELECT "propertyId" AS id, 1 - ("embedding" <=> ${toVectorLiteral(queryVector)}::vector) AS similarity
      FROM "PropertyEmbedding"
      WHERE "propertyId" IN (${Prisma.join(propertyIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY "embedding" <=> ${toVectorLiteral(queryVector)}::vector
      LIMIT ${limit}
    `);

    return rows.map((row) => ({ id: row.id, similarity: Number(row.similarity) }));
  },
};
