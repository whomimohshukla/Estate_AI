import { ArrowLeft, KeyRound, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="auth-brand" to="/" aria-label="EstateAI home">
          <span className="auth-brand-mark"><KeyRound size={20} /></span>
          <span>estate<span>ai</span></span>
        </Link>
        <div className="auth-story-copy">
          <span className="auth-story-kicker"><Sparkles size={14} /> A fresh start begins here</span>
          <h1>Find the place<br />you’ll <em>grow into.</em></h1>
          <p>Thoughtful discovery for the next chapter of your life. Your kind of home is closer than you think.</p>
        </div>
        <div className="auth-story-footer">
          <ShieldCheck size={16} />
          <span>Your details stay private and secure.</span>
        </div>
      </section>
      <section className="auth-form-side">
        <Link className="auth-back-home" to="/"><ArrowLeft size={15} />Back to EstateAI</Link>
        <div className="auth-form-container">
          <Outlet />
        </div>
        <p className="auth-legal">A secure way to find the place you’ll call home.</p>
      </section>
    </main>
  )
}
