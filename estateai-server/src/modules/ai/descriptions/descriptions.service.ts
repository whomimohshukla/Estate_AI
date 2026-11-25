import { Type, type Schema } from '@google/genai';
import { generateStructured, geminiEnabled } from '../../../config/gemini.js';
import { logger } from '../../../config/logger.js';
import { AppError } from '../../../utils/AppError.js';
import { propertiesService, type Viewer } from '../../properties/properties.service.js';
import type { PropertyDto } from '../../properties/properties.types.js';
import {
  generatedDescriptionSchema,
  type GeneratedDescription,
  type GenerateDescriptionInput,
} from './descriptions.schema.js';

const outputSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    shortDescription: { type: Type.STRING },
    detailedDescription: { type: Type.STRING },
    highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
    seoDescription: { type: Type.STRING },
    socialDescription: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'title', 'shortDescription', 'detailedDescription', 'highlights',
    'seoDescription', 'socialDescription', 'tags',
  ],
};

const SYSTEM_INSTRUCTION = [
  'Write property marketing copy using only the supplied verified property facts.',
  'Do not invent amenities, distances, specifications, approvals or facilities.',
  'Do not state that a property is available unless the supplied status says AVAILABLE.',
  'Return all values in the requested JSON structure.',
].join(' ');

function factualContext(property: PropertyDto): string {
  return [
    `Title: ${property.title}`,
    `Type: ${property.propertyType}`,
    `Purpose: ${property.purpose}`,
    `Price INR: ${property.price}`,
    `Bedrooms: ${property.bedrooms}`,
    `Bathrooms: ${property.bathrooms}`,
    `Area sq ft: ${property.areaSqFt}`,
    `City: ${property.city}`,
    `Locality: ${property.locality}`,
    `State: ${property.state}`,
    `Amenities: ${property.amenities.join(', ') || 'none supplied'}`,
    `Furnishing: ${property.furnishing}`,
    `Parking: ${property.parking ? 'yes' : 'no'}`,
    `Verified metro distance km: ${property.metroDistanceKm ?? 'not supplied'}`,
    `Status: ${property.status}`,
  ].join('\n');
}

function assertNoInventedNumbers(output: GeneratedDescription, property: PropertyDto): void {
  const allowed = new Set([
    String(property.price),
    String(property.bedrooms),
    String(property.bathrooms),
    String(property.areaSqFt),
    property.metroDistanceKm === null ? '' : String(property.metroDistanceKm),
  ]);

  const text = Object.values(output).flat().join(' ');
  const numbers = text.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  if (numbers.some((number) => !allowed.has(number))) {
    throw new AppError(502, 'AI output contained unverified numeric claims', 'AI_INVALID_RESPONSE');
  }
}

function fallbackDescription(property: PropertyDto, tone: GenerateDescriptionInput['tone']): GeneratedDescription {
  const purposeText = property.purpose === 'RENT' ? 'available for rent' : 'for sale';
  const bedroomText = property.bedrooms > 0 ? `${property.bedrooms} bedroom ` : '';
  const highlights = [
    `${property.areaSqFt} sq ft`,
    ...property.amenities.slice(0, 5),
    property.parking && !property.amenities.includes('PARKING') ? 'Parking' : '',
    property.metroDistanceKm !== null ? `${property.metroDistanceKm} km from metro` : '',
  ].filter(Boolean);

  return {
    title: `${bedroomText}${property.propertyType.toLowerCase()} ${purposeText} in ${property.locality}, ${property.city}`.replace(/\s+/g, ' ').trim(),
    shortDescription: `${property.title} is ${purposeText} in ${property.locality}, ${property.city}. It offers ${property.areaSqFt} sq ft with ${property.amenities.join(', ') || 'no additional amenities listed'}.`,
    detailedDescription: `This ${property.propertyType.toLowerCase()} in ${property.locality}, ${property.city} has ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms and ${property.areaSqFt} sq ft of space. The listing is ${purposeText} at INR ${property.price}. Furnishing: ${property.furnishing}. Amenities supplied by the agent: ${property.amenities.join(', ') || 'none'}.`,
    highlights: highlights.length > 0 ? highlights : [`${property.propertyType} in ${property.city}`],
    seoDescription: `${property.title} - ${property.propertyType} ${purposeText} in ${property.locality}, ${property.city}. ${property.areaSqFt} sq ft at INR ${property.price}.`,
    socialDescription: `Discover ${property.title} in ${property.city}. ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, ${property.areaSqFt} sq ft. ${tone.toLowerCase()} listing.`,
    tags: [
      property.city,
      property.locality,
      property.propertyType,
      property.purpose,
      ...property.amenities.slice(0, 5),
    ].filter(Boolean),
  };
}

export const descriptionsService = {
  async generate(input: GenerateDescriptionInput, viewer: Viewer): Promise<GeneratedDescription> {
    const property = await propertiesService.getById(input.propertyId, viewer);

    if (geminiEnabled) {
      try {
        const output = await generateStructured<unknown>({
          systemInstruction: `${SYSTEM_INSTRUCTION}\nTone: ${input.tone}`,
          prompt: factualContext(property),
          schema: outputSchema,
        });
        const parsed = generatedDescriptionSchema.parse(output);
        assertNoInventedNumbers(parsed, property);
        return parsed;
      } catch (error) {
        logger.warn({ err: error }, 'Gemini description generation failed; using factual template');
      }
    }

    return fallbackDescription(property, input.tone);
  },
};
