import { extractedFiltersSchema, type ExtractedFilters } from './search.schema.js';

const CITIES = [
  'noida', 'delhi', 'new delhi', 'gurgaon', 'gurugram', 'mumbai', 'pune', 'bengaluru', 'bangalore',
  'hyderabad', 'chennai', 'kolkata', 'jaipur', 'ahmedabad', 'chandigarh', 'kochi', 'lucknow',
];

function amount(value: string, unit: string | undefined): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;

  const multiplier = (unit ?? '').toLowerCase();
  if (multiplier === 'crore') return number * 10_000_000;
  if (multiplier === 'lakh' || multiplier === 'lac') return number * 100_000;
  if (multiplier === 'thousand' || multiplier === 'k') return number * 1_000;
  if (multiplier === 'million' || multiplier === 'mn') return number * 1_000_000;
  return number <= 1000 ? number * 100_000 : number;
}

function extractAmount(query: string, kind: 'min' | 'max'): number | null {
  const keywords =
    kind === 'max'
      ? 'under|below|less than|up to|upto|within|budget of|around|maximum|max'
      : 'above|over|starting from|starting at|from|minimum|min|at least';
  const pattern = new RegExp(
    `(?:${keywords})\\s*(?:rs\\.?|inr|₹)?\\s*(\\d+(?:\\.\\d+)?)\\s*(crore|lakh|lac|thousand|k|million|mn)?`,
    'i',
  );
  const match = pattern.exec(query);
  if (!match) return null;

  const value = amount(match[1] ?? '0', match[2]);
  return value > 0 ? value : null;
}

export function parseQueryOffline(query: string): ExtractedFilters {
  const normalized = query.toLowerCase();
  const city = CITIES.find((name) => new RegExp(`\\b${name}\\b`).test(normalized));
  const bhk = /(\d+)\s*(?:bhk|bedroom)/i.exec(query);
  const bath = /(\d+)\s*(?:bath|bathroom)/i.exec(query);

  let propertyType: ExtractedFilters['propertyType'] = null;
  if (/\b(apartment|flat)\b/.test(normalized)) propertyType = 'APARTMENT';
  else if (/\b(house|independent house)\b/.test(normalized)) propertyType = 'HOUSE';
  else if (/\bvilla\b/.test(normalized)) propertyType = 'VILLA';
  else if (/\bplot|land\b/.test(normalized)) propertyType = 'PLOT';
  else if (/\bcommercial|shop|office\b/.test(normalized)) propertyType = 'COMMERCIAL';

  const purpose: ExtractedFilters['purpose'] = /\b(rent|rental|lease)\b/.test(normalized)
    ? 'RENT'
    : /\b(buy|purchase|sale)\b/.test(normalized)
      ? 'SALE'
      : null;

  const amenityPatterns: Array<[ExtractedFilters['amenities'][number], RegExp]> = [
    ['PARKING', /\bparking\b/],
    ['GYM', /\bgym\b/],
    ['LIFT', /\blift\b/],
    ['SECURITY', /\bsecurity\b/],
    ['SWIMMING_POOL', /\b(pool|swimming)\b/],
    ['GARDEN', /\bgarden\b/],
    ['BALCONY', /\bbalcony\b/],
    ['AIR_CONDITIONING', /\b(ac|air conditioning)\b/],
    ['SCHOOL_NEARBY', /\bschool\b/],
    ['HOSPITAL_NEARBY', /\bhospital\b/],
    ['SHOPPING_NEARBY', /\b(shopping|mall)\b/],
    ['PET_FRIENDLY', /\bpet friendly\b/],
  ];

  const amenities = amenityPatterns.filter(([, pattern]) => pattern.test(normalized)).map(([name]) => name);

  let furnishing: ExtractedFilters['furnishing'] = null;
  if (/\bsemi[- ]furnished\b/.test(normalized)) furnishing = 'SEMI_FURNISHED';
  else if (/\bfurnished\b/.test(normalized)) furnishing = 'FURNISHED';
  else if (/\bunfurnished\b/.test(normalized)) furnishing = 'UNFURNISHED';

  const parsed = extractedFiltersSchema.parse({
    city: city ?? null,
    locality: null,
    propertyType,
    purpose,
    bedrooms: bhk ? Number(bhk[1]) : null,
    bathrooms: bath ? Number(bath[1]) : null,
    minPrice: extractAmount(query, 'min'),
    maxPrice: extractAmount(query, 'max'),
    amenities,
    parking: /\bparking\b/.test(normalized) || null,
    furnishing,
  });

  return parsed;
}
