import { api } from '../lib/api'
import type { ApiSuccess } from '../types/api'
import type { AiSearchHistoryItem, AiSearchResult } from '../types/ai-search'

export interface AiSearchInput {
  query: string
  page?: number
  limit?: number
}

export const aiSearchService = {
  async search(input: AiSearchInput, signal?: AbortSignal): Promise<AiSearchResult> {
    const response = await api.post<ApiSuccess<AiSearchResult>>('/ai/search', {
      query: input.query,
      page: input.page ?? 1,
      limit: input.limit ?? 9,
    }, { signal })
    return response.data.data
  },

  async history(signal?: AbortSignal): Promise<AiSearchHistoryItem[]> {
    const response = await api.get<ApiSuccess<{ history: AiSearchHistoryItem[] }>>('/saved-searches/history?limit=8', { signal })
    return response.data.data.history
  },
}
