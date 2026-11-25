import type { PaginationMeta } from './api'
import type { Property } from './property'

export interface AiSearchResult {
  query: string
  interpretedFilters: Record<string, unknown>
  properties: Property[]
  scores: Record<string, number>
  ranking: 'sql' | 'hybrid'
  suggestions: Array<{ id: string; title: string; price: number }>
  meta: PaginationMeta
}

export interface ChatResponse {
  conversationId: string
  messageId: string
  answer: string
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

export interface ConversationSummary {
  id: string
  title: string | null
  propertyId: string | null
  updatedAt: string
  messages: ChatMessage[]
}

export interface ComparisonResult {
  properties: Property[]
  highlights: {
    cheapest: Property
    largest: Property
    bestValue: Property
    mostBedrooms: Property
    nearestMetro: Property | null
  }
  explanation: string
  savedComparisonId: string
}

export interface SavedComparison {
  id: string
  propertyIds: string[]
  createdAt: string
}

export interface SavedSearch {
  id: string
  name: string
  query: string | null
  filters: Record<string, unknown>
  notify: boolean
  createdAt: string
  updatedAt: string
}

export interface SearchHistoryItem {
  id: string
  query: string
  filters: Record<string, unknown>
  resultCount: number
  createdAt: string
}

export interface LeadSummary {
  id: string
  propertyId: string
  buyerId: string
  agentId: string
  status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NEGOTIATION' | 'CONVERTED' | 'LOST'
  budgetMax: number | string | null
  requirements: string | null
  message: string
  source: string | null
  createdAt: string
  updatedAt: string
  property: { id: string; title: string; city: string; price: number; status: string }
  buyer: { id: string; firstName: string; lastName: string; email: string }
  activities: Array<{ id: string; type: string; notes: string | null; dueAt: string | null; createdAt: string }>
}

export interface AppNotification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

export interface PropertyReport {
  id: string
  propertyId: string
  reporterId: string
  reason: string
  details: string | null
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
  property?: { id: string; title: string; city: string }
  reporter?: { id: string; firstName: string; lastName: string; email: string }
}

export interface AgentDashboard {
  properties: {
    total: number
    byStatus: Record<string, number>
    totalViews: number
    favorites: number
  }
  leads: {
    total: number
    byStatus: Record<string, number>
    recent: LeadSummary[]
  }
}

export interface AdminDashboard {
  users: { total: number; byRole: Record<string, number> }
  properties: {
    total: number
    byStatus: Record<string, number>
    totalViews: number
    lastSixMonths: number
  }
  leads: { total: number; byStatus: Record<string, number> }
  reports: { total: number; byStatus: Record<string, number> }
  engagement: {
    favorites: number
    savedSearches: number
    searches: number
    unreadNotifications: number
  }
}
