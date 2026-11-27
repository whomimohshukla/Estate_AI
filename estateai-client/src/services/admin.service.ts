import { api } from '../lib/api'
import { unwrap } from '../lib/envelope'
import type { ApiSuccess, PaginationMeta } from '../types/api'
import type { AdminUser, AuditLog } from '../types/app'
import type { Property, PropertyFilters } from '../types/property'
import type { AxiosRequestConfig } from 'axios'

export interface AdminPropertyListResponse {
  properties: Property[]
  meta?: PaginationMeta
}

export const adminService = {
  async listProperties(filters: PropertyFilters = {}): Promise<AdminPropertyListResponse> {
    const config: AxiosRequestConfig = { params: filters }
    const response = await api.get<ApiSuccess<Property[] | { properties: Property[] }>>('/admin/properties', config)
    const data = response.data.data
    return {
      properties: Array.isArray(data) ? data : data.properties ?? [],
      meta: response.data.meta as PaginationMeta | undefined,
    }
  },

  listUsers(): Promise<AdminUser[]> {
    return unwrap(api.get<ApiSuccess<{ users: AdminUser[] }>>('/admin/users')).then((data) => data.users ?? [])
  },

  updateUserStatus(id: string, isActive: boolean): Promise<AdminUser> {
    return unwrap(api.patch<ApiSuccess<{ user: AdminUser }>>(`/admin/users/${id}/status`, { isActive })).then(
      (data) => data.user,
    )
  },

  updateUserRole(id: string, role: AdminUser['role']): Promise<AdminUser> {
    return unwrap(api.patch<ApiSuccess<{ user: AdminUser }>>(`/admin/users/${id}/role`, { role })).then(
      (data) => data.user,
    )
  },

  listAuditLogs(): Promise<AuditLog[]> {
    return unwrap(api.get<ApiSuccess<{ logs: AuditLog[] }>>('/admin/audit-logs')).then((data) => data.logs ?? [])
  },

  async reindexEmbeddings(): Promise<number> {
    const result = await unwrap(api.post<ApiSuccess<{ reindexed?: number; synced?: number }>>('/ai/embeddings/reindex'))
    return result.reindexed ?? result.synced ?? 0
  },
}
