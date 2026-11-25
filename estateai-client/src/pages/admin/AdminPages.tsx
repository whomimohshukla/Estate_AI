import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FileWarning, RotateCcw, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { StatusPanel } from '../../components/common/StatusPanel'
import { ApiError } from '../../lib/api'
import { formatCompactPrice } from '../../lib/format'
import { crmService } from '../../services/crm.service'
import { propertiesService } from '../../services/properties.service'
import '../dashboard/dashboard.css'

export function ApprovalsPage() {
  const queryClient = useQueryClient()
  const pending = useQuery({ queryKey: ['properties', 'pending'], queryFn: () => propertiesService.listPending({ limit: 50 }) })
  const [reasons, setReasons] = useState<Record<string, string>>({})

  const moderate = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject' | 'correction'; reason?: string }) => {
      if (action === 'approve') return propertiesService.approve(id)
      if (action === 'reject') return propertiesService.reject(id, reason)
      return propertiesService.requestCorrection(id, reason)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Listing updated.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not update listing.'),
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">MODERATION</span>
        <h1>Listing approvals</h1>
        <p>Approve verified listings, request corrections, or reject listings that fail review.</p>
      </header>
      {pending.data?.properties.length ? (
        <div className="moderation-list">
          {pending.data.properties.map((property) => (
            <article className="moderation-card" key={property.id}>
              <div>
                <span className="eyebrow">{property.propertyType} · {property.city}</span>
                <h2>{property.title}</h2>
                <p>{property.description}</p>
                <div className="moderation-facts"><span>{formatCompactPrice(property.price)}</span><span>{property.bedrooms} beds</span><span>{property.areaSqFt.toLocaleString('en-IN')} sq ft</span></div>
                <Link className="text-link" to={`/properties/${property.id}`}>View listing</Link>
              </div>
              <div className="moderation-actions">
                <textarea
                  className="field-control"
                  rows={2}
                  placeholder="Reason for rejection or correction"
                  value={reasons[property.id] ?? ''}
                  onChange={(event) => setReasons((current) => ({ ...current, [property.id]: event.target.value }))}
                />
                <button className="btn btn-primary btn-small" type="button" disabled={moderate.isPending} onClick={() => moderate.mutate({ id: property.id, action: 'approve' })}><CheckCircle2 size={15} />Approve</button>
                <button className="btn btn-outline btn-small" type="button" disabled={moderate.isPending} onClick={() => moderate.mutate({ id: property.id, action: 'correction', reason: reasons[property.id] })}><RotateCcw size={15} />Request correction</button>
                <button className="btn btn-outline btn-small danger" type="button" disabled={moderate.isPending} onClick={() => moderate.mutate({ id: property.id, action: 'reject', reason: reasons[property.id] })}><XCircle size={15} />Reject</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <StatusPanel icon={CheckCircle2} title="Nothing to review" description="New pending listings will appear here." />
      )}
    </div>
  )
}

export function ReportsPage() {
  const queryClient = useQueryClient()
  const reports = useQuery({ queryKey: ['reports'], queryFn: () => crmService.listReports() })
  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'RESOLVED' | 'DISMISSED' }) => crmService.reviewReport(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reports'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Report updated.')
    },
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">TRUST & SAFETY</span>
        <h1>Property reports</h1>
        <p>Review user-submitted reports and resolve listing issues.</p>
      </header>
      {reports.data?.length ? (
        <div className="dashboard-list dashboard-list-panel">
          {reports.data.map((report) => (
            <div className="dashboard-list-row report-row" key={report.id}>
              <div>
                <strong>{report.reason}</strong>
                <span>{report.property?.title ?? 'Property'} · {report.details ?? 'No extra details'}</span>
              </div>
              <div className="lead-actions">
                <span className="status-chip">{report.status}</span>
                {report.status === 'PENDING' && (
                  <>
                    <button className="btn btn-primary btn-small" type="button" onClick={() => review.mutate({ id: report.id, status: 'RESOLVED' })}>Resolve</button>
                    <button className="btn btn-outline btn-small" type="button" onClick={() => review.mutate({ id: report.id, status: 'DISMISSED' })}>Dismiss</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StatusPanel icon={FileWarning} title="No reports" description="Submitted property reports will appear here." />
      )}
    </div>
  )
}
