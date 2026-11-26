import { Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface EstateBrandProps {
  className?: string
}

export function EstateBrand({ className = '' }: EstateBrandProps) {
  return (
    <Link className={`brand ${className}`.trim()} to="/" aria-label="Estate home">
      <span className="brand-mark"><Building2 size={19} strokeWidth={2.2} /><i /></span>
      <span className="brand-word">
        <span className="brand-name">Estate</span>
        <small>FIND HOME, YOUR WAY</small>
      </span>
    </Link>
  )
}
