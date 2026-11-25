export const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL'] as const
export const PROPERTY_PURPOSES = ['SALE', 'RENT'] as const
export const FURNISHING_STATUSES = ['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED'] as const
export const PROPERTY_AMENITIES = [
  'PARKING',
  'GYM',
  'LIFT',
  'SECURITY',
  'SWIMMING_POOL',
  'GARDEN',
  'BALCONY',
  'AIR_CONDITIONING',
  'POWER_BACKUP',
  'SCHOOL_NEARBY',
  'HOSPITAL_NEARBY',
  'SHOPPING_NEARBY',
  'PET_FRIENDLY',
] as const

export type PropertyType = (typeof PROPERTY_TYPES)[number]
export type ListingPurpose = (typeof PROPERTY_PURPOSES)[number]
export type FurnishingStatus = (typeof FURNISHING_STATUSES)[number]
export type PropertyAmenity = (typeof PROPERTY_AMENITIES)[number]

export interface PropertyImage {
  id: string
  url: string
  altText: string | null
  position: number
  isCover: boolean
}

export interface Property {
  id: string
  agentId: string
  title: string
  description: string
  propertyType: PropertyType
  purpose: ListingPurpose
  price: number
  bedrooms: number
  bathrooms: number
  areaSqFt: number
  amenities: string[]
  furnishing: FurnishingStatus
  parking: boolean
  metroDistanceKm: number | null
  address: string
  locality: string
  city: string
  state: string
  country: string
  postalCode: string
  latitude: number | null
  longitude: number | null
  status: string
  viewsCount: number
  createdAt: string
  updatedAt: string
  images: PropertyImage[]
  pricePerSqFt: number
}

export interface PropertyFilters {
  page?: number
  limit?: number
  q?: string
  city?: string
  locality?: string
  propertyType?: PropertyType
  purpose?: ListingPurpose
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  minArea?: number
  maxArea?: number
  amenities?: PropertyAmenity[]
  parking?: boolean
  furnishing?: FurnishingStatus
  sortBy?: 'createdAt' | 'price' | 'areaSqFt' | 'bedrooms'
  sortOrder?: 'asc' | 'desc'
}
