import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, LayoutDashboard, LogOut, Menu, Search, X } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { EstateBrand } from '../common/EstateBrand'
import { authService } from '../../services/auth.service'
import { crmService } from '../../services/crm.service'
import { useAuthStore } from '../../store/auth-store'

export function SiteHeader() {
  const { pathname, search } = useLocation()
  const currentLocation = pathname + search
  const [menuState, setMenuState] = useState({ open: false, location: currentLocation })
  const menuOpen = menuState.open && menuState.location === currentLocation
  const searchParams = new URLSearchParams(search)
  const isProperties = pathname === '/properties'
  const isAiSearch = pathname === '/search' || pathname === '/buyer/ai-search'
  const isCompare = pathname === '/buyer/compare' || pathname === '/compare'
  const isRent = searchParams.get('purpose') === 'RENT'
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()
  const workspacePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'AGENT' ? '/agent' : '/buyer'
  const unreadCount = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => crmService.unreadNotificationCount(),
    enabled: Boolean(user),
    refetchInterval: 60_000,
  })

  function closeMenu() {
    setMenuState((current) => ({ ...current, open: false }))
  }

  useEffect(() => {
    if (!menuOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  async function signOut(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    try {
      await authService.logout()
      clearSession()
      toast.success('You’re signed out.')
    } catch (error) {
      clearSession()
      toast.error(error instanceof Error ? error.message : 'Could not sign out. Please try again.')
    } finally {
      queryClient.clear()
      setMenuState((current) => ({ ...current, open: false }))
    }
  }

  return (
    <header className={`site-header ${menuOpen ? 'menu-open' : ''}`}>
      <div className="page-shell header-inner">
        <EstateBrand className="header-brand" />
        <nav id="mobile-navigation" className={`desktop-nav ${menuOpen ? 'mobile-nav-open' : ''}`} aria-label="Main navigation">
          <Link className={isProperties && !isRent ? 'active' : ''} to="/properties" onClick={closeMenu}>Buy</Link>
          <Link className={isProperties && isRent ? 'active' : ''} to="/properties?purpose=RENT" onClick={closeMenu}>Rent</Link>
          <Link className={isAiSearch ? 'active nav-ai-search' : 'nav-ai-search'} to="/search" onClick={closeMenu}><Search size={15} />AI search</Link>
          <Link className={isCompare ? 'active' : ''} to="/buyer/compare" onClick={closeMenu}>Compare</Link>
          <Link to="/#how-it-works" onClick={closeMenu}>How it works</Link>
          <div className="mobile-nav-account">
            {user ? (
              <>
                 <Link className="mobile-workspace-link" to={workspacePath} onClick={closeMenu}><LayoutDashboard size={17} />My workspace</Link>
                 <Link className="mobile-workspace-link" to="/notifications" onClick={closeMenu}><Bell size={17} />Notifications{unreadCount.data ? <span className="notification-count">{unreadCount.data}</span> : null}</Link>
                 <button type="button" className="mobile-signout-link" onClick={signOut}><LogOut size={16} />Sign out</button>

              </>
            ) : (
              <div className="mobile-auth-actions">
                <Link className="btn btn-outline" to="/login" onClick={closeMenu}>Log in</Link>
                <Link className="btn btn-primary" to="/signup" onClick={closeMenu}>Create account <span aria-hidden="true">↗</span></Link>
              </div>
            )}
          </div>
        </nav>
        <div className="header-actions">
          {user ? (
            <div className="account-actions">
              <Link className="workspace-button" to={workspacePath}><LayoutDashboard size={16} /><span>Workspace</span></Link>
              <Link className="notification-link" to="/notifications" aria-label={unreadCount.data ? `${unreadCount.data} unread notifications` : 'Notifications'}>
                <Bell size={17} />
                {unreadCount.data ? <span className="notification-count">{unreadCount.data}</span> : null}
              </Link>
              <button type="button" className="signout-button" onClick={signOut}><LogOut size={15} />Sign out</button>
            </div>
          ) : (
            <div className="account-actions">
              <Link className="header-login" to="/login">Log in</Link>
              <Link className="btn btn-primary btn-small header-signup" to="/signup">Get started <span aria-hidden="true">↗</span></Link>
            </div>
          )}
          <button
            type="button"
            className="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuState({ open: !menuOpen, location: currentLocation })}
          >
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
    </header>
  )
}
