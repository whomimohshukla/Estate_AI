import { create } from 'zustand'
import { authService, type AuthSession } from '../services/auth.service'
import type { SafeUser } from '../types/api'

interface AuthState {
  user: SafeUser | null
  initialized: boolean
  setSession: (session: AuthSession) => void
  setUser: (user: SafeUser) => void
  loadCurrentUser: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setSession: (session) => set({ user: session.user, initialized: true }),
  setUser: (user) => set({ user, initialized: true }),
  loadCurrentUser: async () => {
    try {
      const user = await authService.me()
      set({ user, initialized: true })
    } catch (error) {
      set({ user: null, initialized: true })
      throw error
    }
  },
  clearSession: () => set({ user: null, initialized: true }),
}))
