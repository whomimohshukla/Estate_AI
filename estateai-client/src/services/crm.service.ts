import { api } from '../lib/api'
import { unwrap } from '../lib/envelope'
import type { ApiSuccess, PaginationMeta } from '../types/api'
import type { AppNotification, LeadSummary, PropertyReport, SavedSearch, SearchHistoryItem } from '../types/app'
import type { Property } from '../types/property'

export interface SavedSearchInput {
  name: string
  query?: string
  filters?: Record<string, unknown>
  notify?: boolean
}

export interface LeadInput {
  propertyId: string
  message: string
  requirements?: string
  budgetMax?: number
}

export interface LeadQuery {
  status?: string
  propertyId?: string
  page?: number
  limit?: number
}

export interface NotificationQuery {
  unreadOnly?: boolean
  page?: number
  limit?: number
}

export const crmService = {
  async listFavorites(): Promise<Property[]> {
    return unwrap(api.get<ApiSuccess<{ properties: Property[] }>>('/favorites')).then((data) => data.properties)
  },

  async addFavorite(propertyId: string): Promise<void> {
    await api.post(`/favorites/${propertyId}`)
  },

  async removeFavorite(propertyId: string): Promise<void> {
    await api.delete(`/favorites/${propertyId}`)
  },

  async checkFavorite(propertyId: string): Promise<boolean> {
    return unwrap(api.get<ApiSuccess<{ isFavorite: boolean }>>(`/favorites/${propertyId}`)).then(
      (data) => data.isFavorite,
    )
  },

  async listSavedSearches(): Promise<SavedSearch[]> {
    return unwrap(api.get<ApiSuccess<{ savedSearches: SavedSearch[] }>>('/saved-searches')).then(
      (data) => data.savedSearches,
    )
  },

  createSavedSearch(input: SavedSearchInput): Promise<SavedSearch> {
    return unwrap(api.post<ApiSuccess<{ savedSearch: SavedSearch }>>('/saved-searches', input)).then(
      (data) => data.savedSearch,
    )
  },

  updateSavedSearch(id: string, input: Partial<SavedSearchInput>): Promise<SavedSearch> {
    return unwrap(api.patch<ApiSuccess<{ savedSearch: SavedSearch }>>(`/saved-searches/${id}`, input)).then(
      (data) => data.savedSearch,
    )
  },

  async removeSavedSearch(id: string): Promise<void> {
    await api.delete(`/saved-searches/${id}`)
  },

  async searchHistory(limit = 50): Promise<SearchHistoryItem[]> {
    return unwrap(api.get<ApiSuccess<{ history: SearchHistoryItem[] }>>('/saved-searches/history', { params: { limit } })).then(
      (data) => data.history,
    )
  },

  async clearSearchHistory(): Promise<void> {
    await api.delete('/saved-searches/history')
  },

  async createLead(input: LeadInput): Promise<LeadSummary> {
    return unwrap(api.post<ApiSuccess<{ lead: LeadSummary }>>('/leads', input)).then((data) => data.lead)
  },

  async listLeads(query: LeadQuery): Promise<{ leads: LeadSummary[]; meta?: PaginationMeta }> {
    const response = await api.get<ApiSuccess<{ leads: LeadSummary[] }>>('/leads', { params: query })
    return { leads: response.data.data.leads, meta: response.data.meta as PaginationMeta | undefined }
  },

  async getLead(id: string): Promise<LeadSummary> {
    return unwrap(api.get<ApiSuccess<{ lead: LeadSummary }>>(`/leads/${id}`)).then((data) => data.lead)
  },

  async updateLead(id: string, input: { status?: string; requirements?: string; budgetMax?: number }): Promise<LeadSummary> {
    return unwrap(api.patch<ApiSuccess<{ lead: LeadSummary }>>(`/leads/${id}`, input)).then((data) => data.lead)
  },

  async addLeadActivity(id: string, input: { type: string; notes: string; dueAt?: string }): Promise<void> {
    await api.post(`/leads/${id}/activities`, input)
  },

  async exportLeads(query: LeadQuery = {}): Promise<Blob> {
    const response = await api.get('/leads/export', { params: query, responseType: 'blob' })
    return response.data as Blob
  },

  async listNotifications(query: NotificationQuery): Promise<{ notifications: AppNotification[]; meta?: PaginationMeta }> {
    const response = await api.get<ApiSuccess<{ notifications: AppNotification[] }>>('/notifications', {
      params: { unreadOnly: query.unreadOnly ? 'true' : 'false', page: query.page, limit: query.limit },
    })
    return {
      notifications: response.data.data.notifications,
      meta: response.data.meta as PaginationMeta | undefined,
    }
  },

  async unreadNotificationCount(): Promise<number> {
    return unwrap(api.get<ApiSuccess<{ count: number }>>('/notifications/unread-count')).then((data) => data.count)
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}`)
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.patch('/notifications/read-all')
  },

  async createReport(input: { propertyId: string; reason: string; details?: string }): Promise<PropertyReport> {
    return unwrap(api.post<ApiSuccess<{ report: PropertyReport }>>('/reports', input)).then((data) => data.report)
  },

  async listReports(): Promise<PropertyReport[]> {
    return unwrap(api.get<ApiSuccess<{ reports: PropertyReport[] }>>('/reports')).then((data) => data.reports)
  },

  async reviewReport(id: string, status: 'RESOLVED' | 'DISMISSED' | 'REVIEWED'): Promise<PropertyReport> {
    return unwrap(api.patch<ApiSuccess<{ report: PropertyReport }>>(`/reports/${id}`, { status })).then(
      (data) => data.report,
    )
  },
}
