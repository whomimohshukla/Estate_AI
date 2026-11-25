import { describe, expect, it } from 'vitest'
import { formatCompactPrice, formatPrice, readableAmenity, readableFurnishing, readablePropertyType } from './format'

describe('property formatting', () => {
  it('formats Indian prices using rupees and lakh/crore abbreviations', () => {
    expect(formatPrice(1_250_000)).toContain('12,50,000')
    expect(formatCompactPrice(8_500_000)).toBe('₹85 L')
    expect(formatCompactPrice(20_000_000)).toBe('₹2 Cr')
  })

  it('converts backend property values into readable labels', () => {
    expect(readablePropertyType('APARTMENT')).toBe('Apartment')
    expect(readableFurnishing('SEMI_FURNISHED')).toBe('Semi furnished')
    expect(readableAmenity('SWIMMING_POOL')).toBe('Swimming pool')
  })
})
