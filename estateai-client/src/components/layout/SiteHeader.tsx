import { Building2, Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <Link className="brand" to="/" aria-label="EstateAI home">
          <span className="brand-mark"><Building2 size={19} strokeWidth={2.2} /></span>
          <span>estate<span>ai</span></span>
        </Link>
        <nav id="mobile-navigation" className={`desktop-nav ${menuOpen ? 'mobile-nav-open' : ''}`} aria-label="Main navigation">
          <NavLink to="/properties" onClick={() => setMenuOpen(false)}>Buy</NavLink>
          <NavLink to="/properties?purpose=RENT" onClick={() => setMenuOpen(false)}>Rent</NavLink>
          <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        </nav>
        <div className="header-actions">
          <span className="header-note">Thoughtful homes, found simply.</span>
          <button type="button" className="btn btn-primary btn-small" disabled title="Account journeys are in development">
            Sign in
          </button>
          <button
            type="button"
            className="mobile-menu icon-button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu size={19} />
          </button>
        </div>
      </div>
    </header>
  )
}
