import { api } from '../lib/api'
import { unwrap } from '../lib/envelope'
import type { ApiSuccess, SafeUser } from '../types/api'

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string | null
  avatarUrl?: string | null
}

export const usersService = {
  getMe(): Promise<SafeUser> {
    return unwrap(api.get<ApiSuccess<{ user: SafeUser }>>('/users/me')).then((data) => data.user)
  },

  updateMe(input: UpdateProfileInput): Promise<SafeUser> {
    return unwrap(api.patch<ApiSuccess<{ user: SafeUser }>>('/users/me', input)).then((data) => data.user)
  },
}
