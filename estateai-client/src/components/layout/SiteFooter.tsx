import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="page-shell footer-inner">
        <p>© {currentYear} EstateAI. A more considered way to find home.</p>
        <div className="footer-links">
          <Link to="/properties">Explore homes</Link>
          <a href="mailto:hello@estateai.in">Contact</a>
        </div>
      </div>
    </footer>
  )
}
