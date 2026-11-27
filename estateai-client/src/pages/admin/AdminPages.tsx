import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, CheckCircle2, FileWarning, RefreshCw, RotateCcw, ScrollText, Users, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { StatusPanel } from '../../components/common/StatusPanel'
import { ApiError } from '../../lib/api'
import { formatCompactPrice } from '../../lib/format'
import { adminService } from '../../services/admin.service'
import { crmService } from '../../services/crm.service'
import { propertiesService } from '../../services/properties.service'
import type { AdminUser } from '../../types/app'
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

export function AdminPropertiesPage() {
  const properties = useQuery({
    queryKey: ['admin', 'properties'],
    queryFn: () => adminService.listProperties({ limit: 50 }),
    retry: false,
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">MARKETPLACE OVERVIEW</span>
        <h1>All listings</h1>
        <p>Every property on Estate, including drafts, approvals and archived listings.</p>
      </header>
      {properties.data?.properties.length ? (
        <div className="dashboard-list dashboard-list-panel">
          {properties.data.properties.map((property) => (
            <Link className="dashboard-list-row" to={`/properties/${property.id}`} key={property.id}>
              <div><strong>{property.title}</strong><span>{property.city} · {property.agentId.slice(0, 8)}</span></div>
              <div className="lead-actions">
                <span className="status-chip">{property.status}</span>
                <strong>{formatCompactPrice(property.price)}</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <StatusPanel
          icon={Building2}
          title={properties.isError ? 'Listing overview unavailable' : 'No listings yet'}
          description={properties.isError ? 'The all-listings endpoint may not be available on this server yet.' : 'Properties will appear here once agents publish them.'}
        />
      )}
    </div>
  )
}

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminService.listUsers(), retry: false })

  const setStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminService.updateUserStatus(id, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Account status updated.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not update the account status.'),
  })

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUser['role'] }) => adminService.updateUserRole(id, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Account role updated.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not update the account role.'),
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">ACCESS CONTROL</span>
        <h1>Users</h1>
        <p>Manage account roles and active status across the platform.</p>
      </header>
      {users.data?.length ? (
        <div className="lead-table-wrap">
          <table className="lead-table">
            <thead><tr><th>User</th><th>Email verification</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.data.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.firstName} {user.lastName}</strong><small>{user.email}</small></td>
                  <td>{user.isEmailVerified ? <span className="status-chip">VERIFIED</span> : <span className="status-chip">PENDING</span>}</td>
                  <td>
                    <select
                      className="field-control"
                      value={user.role}
                      aria-label={`Role for ${user.email}`}
                      disabled={setRole.isPending}
                      onChange={(event) => setRole.mutate({ id: user.id, role: event.target.value as AdminUser['role'] })}
                    >
                      {['BUYER', 'AGENT', 'ADMIN'].map((role) => <option key={role}>{role}</option>)}
                    </select>
                  </td>
                  <td>
                    <button
                      className={`btn btn-small ${user.isActive ? 'btn-outline' : 'btn-primary'}`}
                      type="button"
                      disabled={setStatus.isPending}
                      onClick={() => setStatus.mutate({ id: user.id, isActive: !user.isActive })}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StatusPanel
          icon={Users}
          title={users.isError ? 'User management unavailable' : 'No users yet'}
          description={users.isError ? 'The admin users endpoint may not be available on this server yet.' : 'Registered accounts will appear here.'}
        />
      )}
    </div>
  )
}

export function AuditLogsPage() {
  const logs = useQuery({ queryKey: ['admin', 'audit-logs'], queryFn: () => adminService.listAuditLogs(), retry: false })
  const reindex = useMutation({
    mutationFn: () => adminService.reindexEmbeddings(),
    onSuccess: (count) => toast.success(`${count} embeddings reindexed.`),
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not reindex embeddings.'),
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">PLATFORM HISTORY</span>
        <h1>Audit logs</h1>
        <p>Review administrative actions and keep the search index current.</p>
      </header>
      <div className="dashboard-quick-actions">
        <button className="btn btn-outline" type="button" disabled={reindex.isPending} onClick={() => reindex.mutate()}>
          <RefreshCw size={16} />{reindex.isPending ? 'Reindexing…' : 'Reindex embeddings'}
        </button>
      </div>
      {logs.data?.length ? (
        <div className="dashboard-list dashboard-list-panel">
          {logs.data.map((log) => (
            <div className="dashboard-list-row" key={log.id}>
              <div>
                <strong>{log.action}</strong>
                <span>{log.entityType} · {log.entityId} · actor {log.actorId.slice(0, 8)}</span>
              </div>
              <time>{new Date(log.createdAt).toLocaleString('en-IN')}</time>
            </div>
          ))}
        </div>
      ) : (
        <StatusPanel
          icon={ScrollText}
          title={logs.isError ? 'Audit log unavailable' : 'No audit activity'}
          description={logs.isError ? 'The audit-logs endpoint may not be available on this server yet.' : 'Administrative actions will be recorded here.'}
        />
      )}
    </div>
  )
}
