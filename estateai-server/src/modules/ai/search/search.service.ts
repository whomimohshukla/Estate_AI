import { Type, type Schema } from '@google/genai';
import { generateStructured, geminiEnabled } from '../../../config/gemini.js';
import { prisma } from '../../../config/database.js';
import { logger } from '../../../config/logger.js';
import { paginationMeta } from '../../../utils/pagination.js';
import { AMENITIES, type PropertyQueryInput } from '../../properties/properties.schema.js';
import { propertiesService } from '../../properties/properties.service.js';
import type { PropertyDto } from '../../properties/properties.types.js';
import { embeddingsService } from '../embeddings/embeddings.service.js';
import { parseQueryOffline } from './offline-parser.js';
import { extractedFiltersSchema, type AiSearchInput, type ExtractedFilters } from './search.schema.js';

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    city: { type: Type.STRING, nullable: true },
    locality: { type: Type.STRING, nullable: true },
    propertyType: { type: Type.STRING, enum: ['APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL'], nullable: true },
    purpose: { type: Type.STRING, enum: ['SALE', 'RENT'], nullable: true },
    bedrooms: { type: Type.INTEGER, nullable: true },
    bathrooms: { type: Type.INTEGER, nullable: true },
    minPrice: { type: Type.NUMBER, nullable: true },
    maxPrice: { type: Type.NUMBER, nullable: true },
    amenities: { type: Type.ARRAY, items: { type: Type.STRING, enum: [...AMENITIES] } },
    parking: { type: Type.BOOLEAN, nullable: true },
    furnishing: { type: Type.STRING, enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED'], nullable: true },
  },
  required: [
    'city', 'locality', 'propertyType', 'purpose', 'bedrooms', 'bathrooms',
    'minPrice', 'maxPrice', 'amenities', 'parking', 'furnishing',
  ],
};

const SYSTEM_INSTRUCTION = [
  'You convert real estate search requests into structured filters.',
  'Return only filter values explicitly supported by the request; use null when unknown.',
  'Convert Indian amounts to INR digits: 1 lakh = 100000, 1 crore = 10000000.',
  'Never invent amenities, distances, prices or property facts.',
  'Never output SQL or executable code.',
].join(' ');

async function extractFilters(query: string): Promise<ExtractedFilters> {
  if (!geminiEnabled) return parseQueryOffline(query);

  try {
    const output = await generateStructured<unknown>({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: `Buyer request: ${query}`,
      schema: extractionSchema,
    });

    const parsed = extractedFiltersSchema.safeParse(output);
    if (!parsed.success) throw new Error(`Invalid extraction: ${parsed.error.message}`);
    return parsed.data;
  } catch (error) {
    logger.warn({ err: error }, 'Gemini extraction failed; using conservative local parser');
    return parseQueryOffline(query);
  }
}

function toPropertyQuery(filters: ExtractedFilters, input: AiSearchInput): PropertyQueryInput {
  return {
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    city: filters.city ?? undefined,
    locality: filters.locality ?? undefined,
    propertyType: filters.propertyType ?? undefined,
    purpose: filters.purpose ?? undefined,
    bedrooms: filters.bedrooms ?? undefined,
    bathrooms: filters.bathrooms ?? undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    amenities: filters.amenities?.length ? filters.amenities : undefined,
    parking: filters.parking ?? undefined,
    furnishing: filters.furnishing ?? undefined,
  };
}

export const aiSearchService = {
  async search(input: AiSearchInput, viewer?: { id: string }) {
    const filters = await extractFilters(input.query);
    const strictQuery = toPropertyQuery(filters, input);
    const candidates = await propertiesService.list(strictQuery);

    let properties: PropertyDto[] = candidates.items;
    let ranking: 'sql' | 'hybrid' = 'sql';
    const scores: Record<string, number> = {};

    if (candidates.items.length > 1) {
      const queryVector = await embeddingsService.embedQuery(input.query);
      const ranked = await embeddingsService.rank(candidates.items.map((item) => item.id), queryVector, candidates.items.length);

      if (ranked.length > 0) {
        const byId = new Map(candidates.items.map((item) => [item.id, item]));
        properties = ranked.flatMap((entry) => {
          const property = byId.get(entry.id);
          if (!property) return [];
          scores[property.id] = Math.round(entry.similarity * 1000) / 1000;
          return [property];
        });
        ranking = 'hybrid';
      }
    }

    const total = Number(candidates.meta.total ?? 0);
    const start = (input.page - 1) * input.limit;
    const pageItems = properties.slice(start, start + input.limit);

    let suggestions: Array<{ id: string; title: string; price: number }> = [];
    if (total === 0) {
      const relaxed = await propertiesService.list({
        ...strictQuery,
        maxPrice: undefined,
        minPrice: undefined,
        amenities: undefined,
        bedrooms: undefined,
        bathrooms: undefined,
        furnishing: undefined,
        limit: 5,
      });
      suggestions = relaxed.items.map((property) => ({
        id: property.id,
        title: property.title,
        price: property.price,
      }));
    }

    await prisma.auditLog.create({
      data: {
        userId: viewer?.id ?? null,
        action: 'AI_SEARCH',
        entityType: 'SEARCH',
        metadata: { query: input.query, filters, resultCount: total, ranking },
      },
    });

    return {
      query: input.query,
      interpretedFilters: filters,
      properties: pageItems,
      scores,
      ranking,
      suggestions,
      meta: paginationMeta({ ...strictQuery, page: input.page, limit: input.limit }, total),
    };
  },
};
