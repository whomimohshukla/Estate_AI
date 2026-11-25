import { useQuery } from '@tanstack/react-query'
import { aiSearchService, type AiSearchInput } from '../services/ai-search.service'

export const aiSearchKeys = {
  all: ['ai-search'] as const,
  search: (input: AiSearchInput) => [...aiSearchKeys.all, input.query, input.page ?? 1, input.limit ?? 9] as const,
  history: ['ai-search', 'history'] as const,
}

export function useAiPropertySearch(input: AiSearchInput, enabled: boolean) {
  return useQuery({
    queryKey: aiSearchKeys.search(input),
    queryFn: ({ signal }) => aiSearchService.search(input, signal),
    enabled,
    retry: 1,
  })
}

export function useAiSearchHistory(enabled: boolean) {
  return useQuery({
    queryKey: aiSearchKeys.history,
    queryFn: ({ signal }) => aiSearchService.history(signal),
    enabled,
    retry: false,
    staleTime: 60_000,
  })
}
