import { Building2, LogOut, Menu, Search, X } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth-store'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const isProperties = pathname === '/properties'
  const isAiSearch = pathname === '/search'
  const isRent = searchParams.get('purpose') === 'RENT'
  const isApartment = searchParams.get('propertyType') === 'APARTMENT'
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  async function signOut(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    try {
      await authService.logout()
      clearSession()
      toast.success('You’re signed out.')
    } catch (error) {
      clearSession()
      toast.error(error instanceof Error ? error.message : 'Could not sign out. Please try again.')
    }
  }

  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <Link className="brand" to="/" aria-label="EstateAI home">
          <span className="brand-mark"><Building2 size={19} strokeWidth={2.2} /></span>
          <span>estate<span>ai</span></span>
        </Link>
        <nav id="mobile-navigation" className={`desktop-nav ${menuOpen ? 'mobile-nav-open' : ''}`} aria-label="Main navigation">
          <Link className={isProperties && !isRent ? 'active' : ''} to="/properties" onClick={() => setMenuOpen(false)}>Buy</Link>
          <Link className={isProperties && isRent ? 'active' : ''} to="/properties?purpose=RENT" onClick={() => setMenuOpen(false)}>Rent</Link>
          <Link className={isProperties && isApartment ? 'active' : ''} to="/properties?propertyType=APARTMENT" onClick={() => setMenuOpen(false)}>Apartments</Link>
          <Link className={isAiSearch ? 'active nav-ai-search' : 'nav-ai-search'} to="/search" onClick={() => setMenuOpen(false)}><Search size={15} />AI search</Link>
          <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        </nav>
        <div className="header-actions">
          {user ? (
            <div className="account-actions">
              <span className="account-greeting">Hello, {user.firstName}</span>
              <button type="button" className="signout-button" onClick={signOut}><LogOut size={15} />Sign out</button>
            </div>
          ) : (
            <div className="account-actions">
              <Link className="header-login" to="/login">Log in</Link>
              <Link className="btn btn-primary btn-small" to="/signup">Sign up <span aria-hidden="true">↗</span></Link>
            </div>
          )}
          <button
            type="button"
            className="mobile-menu icon-button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
    </header>
  )
}
