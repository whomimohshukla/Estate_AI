export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
  meta?: Record<string, unknown>
}

export interface ApiFailure {
  success: false
  message: string
  errors?: unknown[]
  code?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export type UserRole = 'BUYER' | 'AGENT' | 'ADMIN'

export interface SafeUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
}
