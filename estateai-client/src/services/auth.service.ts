import { api, setAccessToken } from '../lib/api'
import type { ApiSuccess, SafeUser, UserRole } from '../types/api'

export interface AuthSession {
  user: SafeUser
  accessToken: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  firstName: string
  lastName: string
  phone?: string
  role: Exclude<UserRole, 'ADMIN'>
}

async function persistSession<T extends AuthSession>(request: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  const { data } = await request
  setAccessToken(data.data.accessToken)
  return data.data
}

export const authService = {
  login(input: LoginInput): Promise<AuthSession> {
    return persistSession(api.post<ApiSuccess<AuthSession>>('/auth/login', input))
  },

  register(input: RegisterInput): Promise<AuthSession> {
    return persistSession(api.post<ApiSuccess<AuthSession>>('/auth/register', input))
  },

  async me(): Promise<SafeUser> {
    const { data } = await api.get<ApiSuccess<{ user: SafeUser }>>('/auth/me')
    return data.data.user
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },

  async resetPassword(input: { token: string; password: string }): Promise<void> {
    await api.post('/auth/reset-password', input)
  },
}
