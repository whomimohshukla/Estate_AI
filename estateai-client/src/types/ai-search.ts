import type { PaginationMeta } from './api'
import type { Property, PropertyType, ListingPurpose, FurnishingStatus } from './property'

export interface InterpretedFilters {
  city?: string | null
  locality?: string | null
  propertyType?: PropertyType | null
  purpose?: ListingPurpose | null
  bedrooms?: number | null
  bathrooms?: number | null
  minPrice?: number | null
  maxPrice?: number | null
  amenities: string[]
  parking?: boolean | null
  furnishing?: FurnishingStatus | null
}

export interface AiSearchSuggestion {
  id: string
  title: string
  price: number
}

export interface AiSearchResult {
  query: string
  interpretedFilters: InterpretedFilters
  properties: Property[]
  scores: Record<string, number>
  ranking: 'sql' | 'hybrid'
  suggestions: AiSearchSuggestion[]
  meta: PaginationMeta
}

export interface AiSearchHistoryItem {
  id: string
  query: string
  filters: InterpretedFilters
  resultCount: number
  createdAt: string
}
