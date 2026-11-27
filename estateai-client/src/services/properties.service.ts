import type { AxiosRequestConfig } from 'axios'
import { api } from '../lib/api'
import { unwrap } from '../lib/envelope'
import type { ApiSuccess, PaginationMeta } from '../types/api'
import type { Property, PropertyFilters, PropertyImage } from '../types/property'

export interface PropertyListResponse {
  properties: Property[]
  meta?: PaginationMeta
}

export interface CreatePropertyInput {
  title: string
  description: string
  propertyType: Property['propertyType']
  purpose: Property['purpose']
  price: number
  bedrooms: number
  bathrooms: number
  areaSqFt: number
  amenities: string[]
  furnishing: Property['furnishing']
  parking: boolean
  address: string
  locality: string
  city: string
  state: string
  country: string
  postalCode: string
  metroDistanceKm?: number
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>

export type PropertyStatus = 'DRAFT' | 'PENDING' | 'AVAILABLE' | 'SOLD' | 'RENTED' | 'REJECTED' | 'ARCHIVED'

export const propertiesService = {
  async list(filters: PropertyFilters, signal?: AbortSignal): Promise<PropertyListResponse> {
    const config: AxiosRequestConfig = { params: filters, signal }
    const response = await api.get<ApiSuccess<Property[]>>('/properties', config)
    return {
      properties: response.data.data,
      meta: response.data.meta as PaginationMeta | undefined,
    }
  },

  async getById(id: string, signal?: AbortSignal): Promise<Property> {
    const response = await api.get<ApiSuccess<{ property: Property }>>(`/properties/${id}`, { signal })
    return response.data.data.property
  },

  async listMine(filters: PropertyFilters = {}): Promise<PropertyListResponse> {
    const response = await api.get<ApiSuccess<Property[]>>('/agents/me/properties', { params: filters })
    return {
      properties: response.data.data,
      meta: response.data.meta as PaginationMeta | undefined,
    }
  },

  create(input: CreatePropertyInput): Promise<Property> {
    return unwrap(api.post<ApiSuccess<{ property: Property }>>('/properties', input)).then((data) => data.property)
  },

  update(id: string, input: UpdatePropertyInput): Promise<Property> {
    return unwrap(api.patch<ApiSuccess<{ property: Property }>>(`/properties/${id}`, input)).then((data) => data.property)
  },

  archive(id: string): Promise<Property> {
    return unwrap(api.delete<ApiSuccess<{ property: Property }>>(`/properties/${id}`)).then((data) => data.property)
  },

  async uploadImage(id: string, file: File): Promise<void> {
    const form = new FormData()
    form.append('image', file)
    await api.post(`/properties/${id}/images`, form)
  },

  reorderImages(id: string, imageIds: string[]): Promise<PropertyImage[]> {
    return unwrap(api.patch<ApiSuccess<{ images: PropertyImage[] }>>(`/properties/${id}/images/order`, { imageIds })).then(
      (data) => data.images,
    )
  },

  setCoverImage(id: string, imageId: string): Promise<PropertyImage> {
    return unwrap(api.patch<ApiSuccess<{ image: PropertyImage }>>(`/properties/${id}/images/${imageId}/cover`)).then(
      (data) => data.image,
    )
  },

  async deleteImage(id: string, imageId: string): Promise<void> {
    await api.delete(`/properties/${id}/images/${imageId}`)
  },

  async changeStatus(id: string, status: PropertyStatus): Promise<Property> {
    return unwrap(api.patch<ApiSuccess<{ property: Property }>>(`/properties/${id}/status`, { status })).then(
      (data) => data.property,
    )
  },

  async listPending(filters: PropertyFilters = {}): Promise<PropertyListResponse> {
    const response = await api.get<ApiSuccess<Property[]>>('/admin/properties/pending', { params: filters })
    return {
      properties: response.data.data,
      meta: response.data.meta as PaginationMeta | undefined,
    }
  },

  async approve(id: string): Promise<Property> {
    return unwrap(api.patch<ApiSuccess<{ property: Property }>>(`/admin/properties/${id}/approve`)).then(
      (data) => data.property,
    )
  },

  async reject(id: string, reason?: string): Promise<Property> {
    return unwrap(api.patch<ApiSuccess<{ property: Property }>>(`/admin/properties/${id}/reject`, { reason })).then(
      (data) => data.property,
    )
  },

  async requestCorrection(id: string, reason?: string): Promise<Property> {
    return unwrap(
      api.patch<ApiSuccess<{ property: Property }>>(`/admin/properties/${id}/request-correction`, { reason }),
    ).then((data) => data.property)
  },
}
