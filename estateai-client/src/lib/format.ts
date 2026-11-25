import type { FurnishingStatus, PropertyType } from '../types/property'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatPrice(price: number): string {
  return currency.format(price)
}

export function formatCompactPrice(price: number): string {
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(price % 10_000_000 === 0 ? 0 : 1)} Cr`
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(price % 100_000 === 0 ? 0 : 1)} L`
  return currency.format(price)
}

export function readablePropertyType(type: PropertyType): string {
  return type.charAt(0) + type.slice(1).toLowerCase()
}

export function readableFurnishing(status: FurnishingStatus): string {
  return status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())
}

export function readableAmenity(amenity: string): string {
  return amenity.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())
}
