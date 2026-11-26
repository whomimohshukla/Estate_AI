import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ApiError } from '../../lib/api'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth-store'

export function AuthSessionLoader() {
  const { data: user, error } = useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: () => authService.me(),
    retry: false,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (user) useAuthStore.getState().setUser(user)
  }, [user])

  useEffect(() => {
    if (!error) return
    useAuthStore.getState().clearSession()
    if (!(error instanceof ApiError && error.status === 401)) {
      const message = error instanceof ApiError && error.status === undefined
        ? 'Estate’s server is unavailable. Sign-in and listing data may not load.'
        : error instanceof Error ? error.message : 'Could not restore your session.'
      toast.error(message)
    }
  }, [error])

  return null
}
