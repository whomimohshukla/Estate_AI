import { api } from '../lib/api'
import { unwrap } from '../lib/envelope'
import type { ApiSuccess } from '../types/api'
import type {
  AiSearchResult,
  ChatResponse,
  ComparisonResult,
  ConversationSummary,
  SavedComparison,
} from '../types/app'

export interface ChatInput {
  message: string
  propertyId?: string
  conversationId?: string
}

export interface LeadAssistantInput {
  leadId: string
  task: 'SUMMARIZE' | 'FOLLOW_UP' | 'QUESTIONS' | 'PROPERTY_MATCH'
}

export interface LeadAssistantResult {
  leadId: string
  task: string
  answer: string
  suggestions: string[]
  matches: Array<{ id: string; title: string; price: number; city: string }>
}

export const aiService = {
  search(query: string, page = 1): Promise<AiSearchResult> {
    return unwrap(api.post<ApiSuccess<AiSearchResult>>('/ai/search', { query, page, limit: 12 }))
  },

  chat(input: ChatInput): Promise<ChatResponse> {
    return unwrap(api.post<ApiSuccess<ChatResponse>>('/ai/chat', input))
  },

  generateDescription(propertyId: string, tone: 'PROFESSIONAL' | 'LUXURY' | 'FRIENDLY' | 'CONCISE'): Promise<string> {
    return unwrap(
      api.post<ApiSuccess<{ description: { detailedDescription: string } }>>('/ai/generate-description', {
        propertyId,
        tone,
      }),
    ).then((result) => result.description.detailedDescription)
  },

  listConversations(): Promise<ConversationSummary[]> {
    return unwrap(
      api.get<ApiSuccess<{ conversations: ConversationSummary[] }>>('/ai/conversations'),
    ).then((result) => result.conversations)
  },

  getConversation(id: string): Promise<ConversationSummary> {
    return unwrap(
      api.get<ApiSuccess<{ conversation: ConversationSummary }>>(`/ai/conversations/${id}`),
    ).then((result) => result.conversation)
  },

  deleteConversation(id: string): Promise<void> {
    return unwrap(api.delete<ApiSuccess<{ deleted: boolean }>>(`/ai/conversations/${id}`)).then(() => undefined)
  },

  compare(propertyIds: string[]): Promise<ComparisonResult> {
    return unwrap(api.post<ApiSuccess<ComparisonResult>>('/ai/compare', { propertyIds }))
  },

  listComparisons(): Promise<SavedComparison[]> {
    return unwrap(
      api.get<ApiSuccess<{ comparisons: SavedComparison[] }>>('/ai/comparisons'),
    ).then((result) => result.comparisons)
  },

  leadAssistant(input: LeadAssistantInput): Promise<LeadAssistantResult> {
    return unwrap(api.post<ApiSuccess<LeadAssistantResult>>('/ai/lead-assistant', input))
  },
}
