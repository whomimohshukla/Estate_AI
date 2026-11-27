import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Bell,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileWarning,
  Heart,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { StatusPanel } from '../../components/common/StatusPanel'
import { ApiError } from '../../lib/api'
import { formatCompactPrice } from '../../lib/format'
import { aiService } from '../../services/ai.service'
import { crmService } from '../../services/crm.service'
import { dashboardService } from '../../services/dashboard.service'
import { propertiesService } from '../../services/properties.service'
import type { AdminDashboard, AgentDashboard } from '../../types/app'
import './dashboard.css'

function DashboardHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="dashboard-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string | number; hint?: string }) {
  return (
    <div className="metric-card">
      <span className="metric-icon"><Icon size={19} /></span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </div>
  )
}

function DashboardPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton skeleton-line title" />
      <div className="metric-grid">{Array.from({ length: 4 }, (_, index) => <div className="skeleton skeleton-metric" key={index} />)}</div>
    </div>
  )
}

export function BuyerDashboardPage() {
  const buyer = useQuery({ queryKey: ['dashboard', 'buyer'], queryFn: () => dashboardService.buyer(), retry: false })
  const useBuyerApi = buyer.isSuccess && Boolean(buyer.data)
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: () => crmService.listFavorites(), enabled: !useBuyerApi })
  const savedSearches = useQuery({ queryKey: ['saved-searches'], queryFn: () => crmService.listSavedSearches(), enabled: !useBuyerApi })
  const inquiries = useQuery({ queryKey: ['leads', 'buyer'], queryFn: () => crmService.listLeads({ limit: 5 }), enabled: !useBuyerApi })
  const comparisons = useQuery({ queryKey: ['comparisons'], queryFn: () => aiService.listComparisons(), enabled: !useBuyerApi })
  const favoriteCount = useBuyerApi ? buyer.data?.favorites.length ?? 0 : favorites.data?.length ?? 0
  const savedSearchList = useBuyerApi ? buyer.data?.savedSearches ?? [] : savedSearches.data ?? []
  const inquiryList = useBuyerApi ? buyer.data?.inquiries ?? [] : inquiries.data?.leads ?? []
  const comparisonCount = useBuyerApi ? buyer.data?.comparisons.length ?? 0 : comparisons.data?.length ?? 0

  if (!useBuyerApi && (buyer.isPending || favorites.isPending || savedSearches.isPending || inquiries.isPending || comparisons.isPending)) {
    return <DashboardSkeleton />
  }

  return (
    <div className="page-shell dashboard-page">
      <DashboardHeader eyebrow="BUYER WORKSPACE" title="Your home search, organised" description="Find homes, ask Estate, and keep every shortlist and inquiry in one place." />
      <div className="dashboard-quick-actions">
        <Link className="btn btn-primary" to="/buyer/ai-search"><Sparkles size={16} />Search with AI</Link>
        <Link className="btn btn-outline" to="/buyer/chat">Ask the assistant</Link>
        <Link className="btn btn-outline" to="/properties">Browse listings</Link>
      </div>
      <div className="metric-grid">
        <MetricCard icon={Heart} label="Saved homes" value={favoriteCount} />
        <MetricCard icon={BookmarkCheck} label="Saved searches" value={savedSearchList.length} />
        <MetricCard icon={ClipboardList} label="Inquiries" value={inquiryList.length} />
        <MetricCard icon={Building2} label="Comparisons" value={comparisonCount} />
      </div>
      <div className="dashboard-columns">
        <DashboardPanel title="Recent inquiries" action={<Link className="text-link" to="/buyer/inquiries">View all<ArrowRight size={15} /></Link>}>
          {inquiryList.length ? (
            <div className="dashboard-list">
              {inquiryList.map((lead) => (
                <Link className="dashboard-list-row" to={`/properties/${lead.propertyId}`} key={lead.id}>
                  <div><strong>{lead.property.title}</strong><span>{lead.property.city}</span></div>
                  <span className="status-chip">{lead.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <StatusPanel icon={ClipboardList} title="No inquiries yet" description="Contact an agent from any listing to start a conversation." />
          )}
        </DashboardPanel>
        <DashboardPanel title="Saved searches" action={<Link className="text-link" to="/buyer/saved-searches">Manage<ArrowRight size={15} /></Link>}>
          {savedSearchList.length ? (
            <div className="dashboard-list">
              {savedSearchList.slice(0, 5).map((search) => (
                <div className="dashboard-list-row" key={search.id}>
                  <div><strong>{search.name}</strong><span>{search.query || 'Saved filters'}</span></div>
                  <span className="status-chip">{search.notify ? 'ALERTS ON' : 'ALERTS OFF'}</span>
                </div>
              ))}
            </div>
          ) : (
            <StatusPanel icon={BookmarkCheck} title="No saved searches" description="Save a search to get notified when a matching listing is approved." />
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}

export function AgentDashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard', 'agent'], queryFn: () => dashboardService.agent() })
  const properties = useQuery({ queryKey: ['properties', 'mine'], queryFn: () => propertiesService.listMine({ limit: 5 }) })

  if (dashboard.isPending || properties.isPending) return <DashboardSkeleton />
  const data: AgentDashboard | undefined = dashboard.data

  return (
    <div className="page-shell dashboard-page">
      <DashboardHeader eyebrow="AGENT WORKSPACE" title="Grow your listing pipeline" description="Track your properties, respond to leads, and publish verified listings faster." />
      <div className="dashboard-quick-actions">
        <Link className="btn btn-primary" to="/agent/properties"><Building2 size={16} />Manage properties</Link>
        <Link className="btn btn-outline" to="/agent/leads">Lead pipeline</Link>
      </div>
      <div className="metric-grid">
        <MetricCard icon={Building2} label="Listings" value={data?.properties.total ?? 0} hint={`${data?.properties.byStatus.PENDING ?? 0} pending approval`} />
        <MetricCard icon={Eye} label="Listing views" value={data?.properties.totalViews ?? 0} />
        <MetricCard icon={Heart} label="Favorite saves" value={data?.properties.favorites ?? 0} />
        <MetricCard icon={Users} label="Leads" value={data?.leads.total ?? 0} hint={`${data?.leads.byStatus.NEW ?? 0} new`} />
      </div>
      <div className="dashboard-columns">
        <DashboardPanel title="Your latest listings" action={<Link className="text-link" to="/agent/properties">View all<ArrowRight size={15} /></Link>}>
          {properties.data?.properties.length ? (
            <div className="dashboard-list">
              {properties.data.properties.map((property) => (
                <Link className="dashboard-list-row" to={`/properties/${property.id}`} key={property.id}>
                  <div><strong>{property.title}</strong><span>{property.city} · {formatCompactPrice(property.price)}</span></div>
                  <span className="status-chip">{property.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <StatusPanel icon={Building2} title="No listings yet" description="Create your first listing and submit it for approval." />
          )}
        </DashboardPanel>
        <DashboardPanel title="Recent leads" action={<Link className="text-link" to="/agent/leads">Open pipeline<ArrowRight size={15} /></Link>}>
          {data?.leads.recent.length ? (
            <div className="dashboard-list">
              {data.leads.recent.map((lead) => (
                <Link className="dashboard-list-row" to="/agent/leads" key={lead.id}>
                  <div><strong>{lead.buyer.firstName} {lead.buyer.lastName}</strong><span>{lead.property.title}</span></div>
                  <span className="status-chip">{lead.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <StatusPanel icon={Users} title="No leads yet" description="Buyer inquiries will appear here as soon as they arrive." />
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: () => dashboardService.admin() })
  const pending = useQuery({ queryKey: ['properties', 'pending'], queryFn: () => propertiesService.listPending({ limit: 5 }) })
  const reports = useQuery({ queryKey: ['reports'], queryFn: () => crmService.listReports() })

  if (dashboard.isPending || pending.isPending || reports.isPending) return <DashboardSkeleton />
  const data: AdminDashboard | undefined = dashboard.data

  return (
    <div className="page-shell dashboard-page">
      <DashboardHeader eyebrow="ADMIN WORKSPACE" title="Platform control centre" description="Review listings, resolve reports, and monitor marketplace activity." />
      <div className="dashboard-quick-actions">
        <Link className="btn btn-primary" to="/admin/approvals"><CheckCircle2 size={16} />Review approvals</Link>
        <Link className="btn btn-outline" to="/admin/properties">All listings</Link>
        <Link className="btn btn-outline" to="/admin/users">Users</Link>
        <Link className="btn btn-outline" to="/admin/reports">Property reports</Link>
        <Link className="btn btn-outline" to="/admin/audit-logs">Audit logs</Link>
        <Link className="btn btn-outline" to="/admin/analytics">Analytics</Link>
      </div>
      <div className="metric-grid">
        <MetricCard icon={Users} label="Users" value={data?.users.total ?? 0} hint={`${data?.users.byRole.AGENT ?? 0} agents`} />
        <MetricCard icon={Building2} label="Listings" value={data?.properties.total ?? 0} hint={`${data?.properties.byStatus.PENDING ?? 0} pending`} />
        <MetricCard icon={Eye} label="Total views" value={data?.properties.totalViews ?? 0} />
        <MetricCard icon={FileWarning} label="Open reports" value={data?.reports.byStatus.PENDING ?? 0} />
      </div>
      <div className="dashboard-columns">
        <DashboardPanel title="Listings awaiting review" action={<Link className="text-link" to="/admin/approvals">Review queue<ArrowRight size={15} /></Link>}>
          {pending.data?.properties.length ? (
            <div className="dashboard-list">
              {pending.data.properties.map((property) => (
                <Link className="dashboard-list-row" to={`/properties/${property.id}`} key={property.id}>
                  <div><strong>{property.title}</strong><span>{property.city} · {property.propertyType}</span></div>
                  <span className="status-chip">PENDING</span>
                </Link>
              ))}
            </div>
          ) : (
            <StatusPanel icon={CheckCircle2} title="Queue is clear" description="There are no listings waiting for approval." />
          )}
        </DashboardPanel>
        <DashboardPanel title="Engagement" action={<Link className="text-link" to="/admin/analytics">Full analytics<ArrowRight size={15} /></Link>}>
          <div className="engagement-list">
            <div><span>Favorites</span><strong>{data?.engagement.favorites ?? 0}</strong></div>
            <div><span>Saved searches</span><strong>{data?.engagement.savedSearches ?? 0}</strong></div>
            <div><span>AI searches</span><strong>{data?.engagement.searches ?? 0}</strong></div>
            <div><span>Unread notifications</span><strong>{data?.engagement.unreadNotifications ?? 0}</strong></div>
          </div>
        </DashboardPanel>
      </div>
      <div className="dashboard-panel">
        <div className="dashboard-panel-header"><h2>Reports</h2><Link className="text-link" to="/admin/reports">Review all<ArrowRight size={15} /></Link></div>
        {reports.data?.length ? (
          <div className="dashboard-list">
            {reports.data.slice(0, 5).map((report) => (
              <Link className="dashboard-list-row" to="/admin/reports" key={report.id}>
                <div><strong>{report.reason}</strong><span>{report.property?.title ?? 'Property report'}</span></div>
                <span className="status-chip">{report.status}</span>
              </Link>
            ))}
          </div>
        ) : (
          <StatusPanel icon={FileWarning} title="No reports" description="Property reports submitted by users will appear here." />
        )}
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => crmService.listNotifications({ limit: 50 }) })
  const markAll = useMutation({
    mutationFn: () => crmService.markAllNotificationsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      toast.success('All notifications marked as read.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not update notifications.'),
  })

  const markOne = useMutation({
    mutationFn: (id: string) => crmService.markNotificationRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      toast.success('Notification marked as read.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not update the notification.'),
  })

  return (
    <div className="page-shell dashboard-page">
      <DashboardHeader eyebrow="ACTIVITY" title="Notifications" description="Lead updates, saved-search matches, and platform activity." />
      <div className="dashboard-quick-actions">
        <button className="btn btn-outline" type="button" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
          <Bell size={16} />Mark all as read
        </button>
      </div>
      {notifications.isPending ? <DashboardSkeleton /> : notifications.data?.notifications.length ? (
        <div className="notification-list">
          {notifications.data.notifications.map((notification) => (
            <article className={`notification-item ${notification.isRead ? '' : 'unread'}`} key={notification.id}>
              <span className="notification-type">{notification.type.replaceAll('_', ' ')}</span>
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                {!notification.isRead && (
                  <button className="btn btn-outline btn-small" type="button" disabled={markOne.isPending} onClick={() => markOne.mutate(notification.id)}>Mark as read</button>
                )}
              </div>
              <time>{new Date(notification.createdAt).toLocaleString('en-IN')}</time>
              {!notification.isRead && <span className="unread-dot" aria-label="Unread" />}
            </article>
          ))}
        </div>
      ) : (
        <StatusPanel icon={Bell} title="You’re all caught up" description="Notifications will appear here when something needs your attention." />
      )}
    </div>
  )
}

export function AssistantTeaser() {
  return (
    <Link className="assistant-floating" to="/buyer/chat" aria-label="Open Estate assistant">
      <MessageSquare size={20} />
      <span>Ask Estate</span>
    </Link>
  )
}

export function AdminAnalyticsPage() {
  const analytics = useQuery({ queryKey: ['dashboard', 'analytics'], queryFn: () => dashboardService.analytics() })

  if (analytics.isPending) return <DashboardSkeleton />
  const data = analytics.data

  return (
    <div className="page-shell dashboard-page">
      <DashboardHeader eyebrow="PLATFORM INSIGHTS" title="Analytics" description="A live snapshot of marketplace supply, demand and engagement." />
      <div className="metric-grid">
        <MetricCard icon={Building2} label="Total listings" value={data?.properties.total ?? 0} hint={`${data?.properties.lastSixMonths ?? 0} in last 6 months`} />
        <MetricCard icon={Eye} label="Property views" value={data?.properties.totalViews ?? 0} />
        <MetricCard icon={ClipboardList} label="Leads" value={data?.leads.total ?? 0} />
        <MetricCard icon={Sparkles} label="AI searches" value={data?.engagement.searches ?? 0} />
      </div>
      <div className="dashboard-columns">
        <DashboardPanel title="Users by role">
          <div className="engagement-list">
            {Object.entries(data?.users.byRole ?? {}).map(([role, count]) => <div key={role}><span>{role}</span><strong>{count}</strong></div>)}
          </div>
        </DashboardPanel>
        <DashboardPanel title="Listings by status">
          <div className="engagement-list">
            {Object.entries(data?.properties.byStatus ?? {}).map(([status, count]) => <div key={status}><span>{status}</span><strong>{count}</strong></div>)}
          </div>
        </DashboardPanel>
      </div>
    </div>
  )
}
