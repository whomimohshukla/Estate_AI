import type { AxiosRequestConfig } from 'axios'
import { api } from '../lib/api'
import type { ApiSuccess, PaginationMeta } from '../types/api'
import type { Property, PropertyFilters } from '../types/property'

export interface PropertyListResponse {
  properties: Property[]
  meta?: PaginationMeta
}

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
}
