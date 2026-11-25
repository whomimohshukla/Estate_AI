import { generateText, geminiEnabled } from '../../../config/gemini.js';
import { prisma } from '../../../config/database.js';
import { logger } from '../../../config/logger.js';
import { AppError } from '../../../utils/AppError.js';
import { propertiesService, type Viewer } from '../../properties/properties.service.js';
import type { PropertyDto } from '../../properties/properties.types.js';
import type { CompareInput } from './comparison.schema.js';

function metrics(properties: PropertyDto[]) {
  const cheapest = [...properties].sort((a, b) => a.price - b.price)[0];
  const largest = [...properties].sort((a, b) => b.areaSqFt - a.areaSqFt)[0];
  const bestValue = [...properties].sort((a, b) => a.pricePerSqFt - b.pricePerSqFt)[0];
  const mostBedrooms = [...properties].sort((a, b) => b.bedrooms - a.bedrooms)[0];
  const withMetro = properties.filter((property) => property.metroDistanceKm !== null);
  const nearestMetro = withMetro.length
    ? withMetro.sort((a, b) => (a.metroDistanceKm ?? Infinity) - (b.metroDistanceKm ?? Infinity))[0]
    : null;

  return { cheapest, largest, bestValue, mostBedrooms, nearestMetro };
}

function comparisonFacts(properties: PropertyDto[]): string {
  return properties
    .map((property) =>
      [
        property.title,
        `price INR ${property.price}`,
        `area ${property.areaSqFt} sq ft`,
        `price per sq ft ${property.pricePerSqFt}`,
        `${property.bedrooms} bedrooms`,
        `${property.bathrooms} bathrooms`,
        `amenities ${property.amenities.join(', ') || 'none supplied'}`,
        `furnishing ${property.furnishing}`,
        `metro distance ${property.metroDistanceKm ?? 'not supplied'} km`,
        `location ${property.locality}, ${property.city}`,
      ].join('; '),
    )
    .join('\n');
}

function fallbackExplanation(properties: PropertyDto[]): string {
  const summary = metrics(properties);
  return [
    `${summary.cheapest?.title} has the lowest listed price at INR ${summary.cheapest?.price}.`,
    `${summary.largest?.title} offers the largest area at ${summary.largest?.areaSqFt} sq ft.`,
    `${summary.bestValue?.title} has the lowest backend-computed price per sq ft at INR ${summary.bestValue?.pricePerSqFt}.`,
    `Amenities differ: ${properties.map((property) => `${property.title} (${property.amenities.join(', ') || 'none'})`).join('; ')}.`,
  ].join(' ');
}

function containsUnverifiedNumber(explanation: string, properties: PropertyDto[]): boolean {
  const allowed = new Set(
    properties
      .flatMap((property) => [
        String(property.price),
        String(property.pricePerSqFt),
        String(property.areaSqFt),
        String(property.bedrooms),
        String(property.bathrooms),
        property.metroDistanceKm === null ? '' : String(property.metroDistanceKm),
      ])
      .join(' ')
      .match(/\b\d+(?:\.\d+)?\b/g) ?? [],
  );
  return (explanation.match(/\b\d+(?:\.\d+)?\b/g) ?? []).some((number) => !allowed.has(number));
}

export const comparisonService = {
  async compare(input: CompareInput, viewer?: Viewer, userId?: string) {
    const properties = await Promise.all(
      input.propertyIds.map((id) => propertiesService.getById(id, viewer)),
    );
    const summary = metrics(properties);

    let explanation = fallbackExplanation(properties);
    if (geminiEnabled) {
      try {
        const generated = await generateText(
          'Explain property differences using only the supplied verified facts. Never invent data. Do not recalculate numbers; use those provided.',
          comparisonFacts(properties),
          0.2,
        );
        if (containsUnverifiedNumber(generated, properties)) {
          throw new AppError(502, 'AI comparison contained unverified numbers', 'AI_INVALID_RESPONSE');
        }
        explanation = generated;
      } catch (error) {
        logger.warn({ err: error }, 'Gemini comparison failed; using backend calculations');
      }
    }

    const saved = await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action: 'PROPERTY_COMPARISON',
        entityType: 'COMPARISON',
        metadata: { propertyIds: input.propertyIds },
      },
    });

    return {
      properties: properties.map((property) => ({
        id: property.id,
        title: property.title,
        price: property.price,
        pricePerSqFt: property.pricePerSqFt,
        areaSqFt: property.areaSqFt,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        amenities: property.amenities,
        furnishing: property.furnishing,
        parking: property.parking,
        metroDistanceKm: property.metroDistanceKm,
        city: property.city,
        locality: property.locality,
        images: property.images,
      })),
      highlights: summary,
      explanation,
      savedComparisonId: saved.id,
    };
  },

  async listSaved(userId: string) {
    const logs = await prisma.auditLog.findMany({
      where: { userId, action: 'PROPERTY_COMPARISON' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => ({
      id: log.id,
      propertyIds: (log.metadata as { propertyIds?: string[] } | null)?.propertyIds ?? [],
      createdAt: log.createdAt,
    }));
  },
};
