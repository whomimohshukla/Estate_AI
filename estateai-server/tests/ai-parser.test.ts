import { describe, expect, it } from 'vitest';
import { parseQueryOffline } from '../src/modules/ai/search/offline-parser.js';

describe('offline query parser', () => {
  it('extracts budget, bedrooms, city, purpose and amenities', () => {
    const filters = parseQueryOffline(
      'Find a 2BHK apartment in Noida under ₹60 lakh with parking and a gym for rent',
    );

    expect(filters.bedrooms).toBe(2);
    expect(filters.city).toBe('noida');
    expect(filters.maxPrice).toBe(6_000_000);
    expect(filters.propertyType).toBe('APARTMENT');
    expect(filters.purpose).toBe('RENT');
    expect(filters.amenities).toContain('PARKING');
    expect(filters.amenities).toContain('GYM');
  });

  it('converts crore amounts and ignores unrelated numbers', () => {
    const filters = parseQueryOffline('looking for a villa in Pune below 1.5 crore with a swimming pool');

    expect(filters.maxPrice).toBe(15_000_000);
    expect(filters.propertyType).toBe('VILLA');
    expect(filters.amenities).toContain('SWIMMING_POOL');
    expect(filters.bedrooms).toBeNull();
  });
});
