import { useQuery } from '@tanstack/react-query'
import { propertiesService } from '../services/properties.service'
import type { PropertyFilters } from '../types/property'

export const propertyKeys = {
  all: ['properties'] as const,
  list: (filters: PropertyFilters) => [...propertyKeys.all, 'list', filters] as const,
  detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
}

export function useProperties(filters: PropertyFilters, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: ({ signal }) => propertiesService.list(filters, signal),
    enabled,
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: ({ signal }) => propertiesService.getById(id, signal),
    enabled: Boolean(id),
  })
}
