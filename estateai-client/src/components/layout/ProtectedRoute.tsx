import { LoaderCircle, LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { StatusPanel } from '../common/StatusPanel'
import { useAuthStore } from '../../store/auth-store'
import type { UserRole } from '../../types/api'

interface ProtectedRouteProps {
  roles?: UserRole[]
  children: ReactNode
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const initialized = useAuthStore((state) => state.initialized)
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="page-shell dashboard-loading">
        <LoaderCircle className="spin" size={28} />
        <p>Restoring your session…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="page-shell dashboard-loading">
        <StatusPanel
          icon={LockKeyhole}
          title="You don’t have access to this area"
          description="This page is restricted to a different account role."
          action={<a className="btn btn-primary" href="/">Return home</a>}
        />
      </div>
    )
  }

  return children
}
