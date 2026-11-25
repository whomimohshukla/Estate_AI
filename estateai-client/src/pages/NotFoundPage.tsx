import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusPanel } from '../components/common/StatusPanel'

export function NotFoundPage() {
  return (
    <section className="page-shell not-found-page">
      <StatusPanel
        icon={SearchX}
        title="We couldn't find that page"
        description="The link may be out of date, or the page may have moved."
        action={<Link className="btn btn-primary" to="/"><ArrowLeft size={16} />Back to home</Link>}
      />
    </section>
  )
}
