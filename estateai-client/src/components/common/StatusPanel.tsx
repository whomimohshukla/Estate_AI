import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatusPanelProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function StatusPanel({ icon: Icon, title, description, action }: StatusPanelProps) {
  return (
    <div className="status-panel">
      <div>
        <Icon className="status-icon" size={27} strokeWidth={1.7} />
        <h3>{title}</h3>
        <p>{description}</p>
        {action && <div className="status-action">{action}</div>}
      </div>
    </div>
  )
}
