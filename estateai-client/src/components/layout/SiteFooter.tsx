import { ArrowUpRight, Building2, Mail, MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="page-shell footer-main">
        <div className="footer-brand-column">
          <Link className="brand footer-brand" to="/" aria-label="EstateAI home">
            <span className="brand-mark"><Building2 size={18} strokeWidth={2.2} /></span>
            <span>estate<span>ai</span></span>
          </Link>
          <p>Find a home by describing what matters to you. EstateAI turns your words into a more thoughtful property search.</p>
          <Link className="footer-ai-link" to="/search"><Sparkles size={15} />Try AI property search <ArrowUpRight size={14} /></Link>
        </div>
        <div className="footer-column">
          <h2>Discover</h2>
          <Link to="/properties">All properties</Link>
          <Link to="/properties?purpose=SALE">Homes to buy</Link>
          <Link to="/properties?purpose=RENT">Homes to rent</Link>
          <Link to="/search">Natural-language search</Link>
        </div>
        <div className="footer-column">
          <h2>Your EstateAI</h2>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Create an account</Link>
          <a href="mailto:hello@estateai.in"><Mail size={14} />Contact us</a>
          <span><MapPin size={14} />Made for finding home in India</span>
        </div>
      </div>
      <div className="page-shell footer-bottom">
        <p>© {currentYear} EstateAI. A more considered way to find home.</p>
        <span>Search with clarity. Move with confidence.</span>
      </div>
    </footer>
  )
}
