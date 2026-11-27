import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookmarkCheck, ClipboardList, Download, Heart, LoaderCircle, MessageSquarePlus, Plus, Sparkles, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { PropertyCard } from '../../components/common/PropertyCard'
import { StatusPanel } from '../../components/common/StatusPanel'
import { ApiError } from '../../lib/api'
import { formatCompactPrice } from '../../lib/format'
import { aiService } from '../../services/ai.service'
import { crmService } from '../../services/crm.service'
import type { LeadStatus, LeadSummary } from '../../types/app'
import '../dashboard/dashboard.css'

const savedSearchSchema = z.object({
  name: z.string().trim().min(2).max(100),
  query: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  notify: z.boolean().default(true),
})

type SavedSearchFormInput = z.input<typeof savedSearchSchema>
type SavedSearchFormValues = z.output<typeof savedSearchSchema>

export function FavoritesPage() {
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: () => crmService.listFavorites() })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">SHORTLIST</span>
        <h1>Saved homes</h1>
        <p>Your favourite listings, kept together for a quick comparison.</p>
      </header>
      {favorites.isPending ? (
        <div className="dashboard-skeleton"><div className="skeleton skeleton-metric" /></div>
      ) : favorites.data?.length ? (
        <div className="property-grid">{favorites.data.map((property) => <PropertyCard property={property} key={property.id} />)}</div>
      ) : (
        <StatusPanel icon={Heart} title="No saved homes yet" description="Tap the heart on any listing to add it here." action={<Link className="btn btn-primary" to="/properties">Browse homes</Link>} />
      )}
    </div>
  )
}

export function SavedSearchesPage() {
  const queryClient = useQueryClient()
  const savedSearches = useQuery({ queryKey: ['saved-searches'], queryFn: () => crmService.listSavedSearches() })
  const history = useQuery({ queryKey: ['search-history'], queryFn: () => crmService.searchHistory() })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SavedSearchFormInput, unknown, SavedSearchFormValues>({
    resolver: zodResolver(savedSearchSchema),
    defaultValues: { name: '', query: '', city: '', notify: true },
  })

  const create = useMutation({
    mutationFn: (values: SavedSearchFormValues) => crmService.createSavedSearch({
      name: values.name,
      query: values.query,
      filters: { city: values.city, maxPrice: values.maxPrice },
      notify: values.notify,
    }),
    onSuccess: async () => {
      reset({ name: '', query: '', city: '', notify: true })
      await queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
      toast.success('Saved search created. Alerts are active.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not save search.'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => crmService.removeSavedSearch(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
      toast.success('Saved search removed.')
    },
  })

  const toggleNotify = useMutation({
    mutationFn: ({ id, notify }: { id: string; notify: boolean }) => crmService.updateSavedSearch(id, { notify }),
    onSuccess: async (savedSearch) => {
      await queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
      toast(savedSearch.notify ? 'Alerts turned on.' : 'Alerts turned off.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not update alerts.'),
  })

  const clearHistory = useMutation({
    mutationFn: () => crmService.clearSearchHistory(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['search-history'] })
      toast.success('Search history cleared.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not clear search history.'),
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">ALERTS</span>
        <h1>Saved searches</h1>
        <p>Save filters and get notified when a matching listing is approved.</p>
      </header>
      <form className="dashboard-form" onSubmit={handleSubmit((values) => create.mutate(values))}>
        <div className="form-grid">
          <label>Name<input className="field-control" {...register('name')} /></label>
          <label>Search phrase<input className="field-control" placeholder="2BHK near metro" {...register('query')} /></label>
          <label>City<input className="field-control" placeholder="Noida" {...register('city')} /></label>
          <label>Max price<input className="field-control" type="number" min={1} {...register('maxPrice')} /></label>
          <label className="checkbox-field"><input type="checkbox" {...register('notify')} /> Email and in-app alerts</label>
        </div>
        {errors.name && <p className="field-error" role="alert">{errors.name.message}</p>}
        <button className="btn btn-primary" type="submit" disabled={create.isPending}>{create.isPending ? <LoaderCircle className="spin" size={16} /> : <BookmarkCheck size={16} />}Save search</button>
      </form>
      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header"><h2>Your saved searches</h2></div>
          {savedSearches.data?.length ? (
            <div className="dashboard-list">
              {savedSearches.data.map((search) => (
                <div className="dashboard-list-row" key={search.id}>
                  <div><strong>{search.name}</strong><span>{search.query || 'Saved filters'}</span></div>
                  <div className="lead-actions">
                    <label className="checkbox-field"><input type="checkbox" checked={search.notify} disabled={toggleNotify.isPending} onChange={(event) => toggleNotify.mutate({ id: search.id, notify: event.target.checked })} />Alerts</label>
                    <button className="icon-button danger" type="button" aria-label={`Delete ${search.name}`} onClick={() => remove.mutate(search.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <StatusPanel icon={BookmarkCheck} title="No saved searches" description="Create one above to start tracking new listings." />}
        </section>
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2>Recent AI searches</h2>
            {history.data?.length ? <button className="btn btn-outline btn-small" type="button" disabled={clearHistory.isPending} onClick={() => clearHistory.mutate()}>Clear history</button> : null}
          </div>
          {history.data?.length ? (
            <div className="dashboard-list">
              {history.data.map((item) => (
                <div className="dashboard-list-row" key={item.id}>
                  <div><strong>{item.query}</strong><span>{item.resultCount} results · {new Date(item.createdAt).toLocaleString('en-IN')}</span></div>
                </div>
              ))}
            </div>
          ) : <StatusPanel icon={ClipboardList} title="No search history" description="Your AI searches will appear here." />}
        </section>
      </div>
    </div>
  )
}

export function InquiriesPage() {
  const leads = useQuery({ queryKey: ['leads', 'buyer'], queryFn: () => crmService.listLeads({ limit: 50 }) })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">MY INQUIRIES</span>
        <h1>Property inquiries</h1>
        <p>Track the status of conversations you started with agents.</p>
      </header>
      {leads.data?.leads.length ? (
        <div className="dashboard-list dashboard-list-panel">
          {leads.data.leads.map((lead) => (
            <Link className="dashboard-list-row" to={`/properties/${lead.propertyId}`} key={lead.id}>
              <div><strong>{lead.property.title}</strong><span>{lead.message}</span></div>
              <span className="status-chip">{lead.status}</span>
            </Link>
          ))}
        </div>
      ) : (
        <StatusPanel icon={MessageSquarePlus} title="No inquiries yet" description="Contact an agent from a property page to begin." action={<Link className="btn btn-primary" to="/properties">Browse homes</Link>} />
      )}
    </div>
  )
}

export function LeadsPage() {
  const queryClient = useQueryClient()
  const leads = useQuery({ queryKey: ['leads', 'agent'], queryFn: () => crmService.listLeads({ limit: 50 }) })
  const [activeLead, setActiveLead] = useState<LeadSummary | null>(null)
  const [activityType, setActivityType] = useState('NOTE')
  const [activityNotes, setActivityNotes] = useState('')
  const activities = useQuery({
    queryKey: ['leads', activeLead?.id, 'activities'],
    queryFn: () => crmService.listLeadActivities(activeLead!.id),
    enabled: Boolean(activeLead),
    retry: false,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => crmService.updateLeadStatus(id, status).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) return crmService.updateLead(id, { status })
      throw error
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead status updated.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not update lead.'),
  })

  const assistant = useMutation({
    mutationFn: (input: { leadId: string; task: 'SUMMARIZE' | 'FOLLOW_UP' | 'QUESTIONS' | 'PROPERTY_MATCH' }) => aiService.leadAssistant(input),
    onSuccess: (data) => toast.success(data.answer.slice(0, 180)),
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Assistant failed.'),
  })

  const addActivity = useMutation({
    mutationFn: ({ id, type, notes }: { id: string; type: string; notes: string }) => crmService.addLeadActivity(id, { type, notes }),
    onSuccess: async (_activity, variables) => {
      setActivityNotes('')
      await queryClient.invalidateQueries({ queryKey: ['leads'] })
      await queryClient.invalidateQueries({ queryKey: ['leads', variables.id, 'activities'] })
      const refreshed = await crmService.getLead(variables.id)
      setActiveLead((current) => current?.id === variables.id ? refreshed : current)
      toast.success('Activity recorded.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not record the activity.'),
  })

  const followUp = useMutation({
    mutationFn: (id: string) => crmService.addLeadFollowUp(id, 'Scheduled follow-up from the lead pipeline.'),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: ['leads'] })
      await queryClient.invalidateQueries({ queryKey: ['leads', id, 'activities'] })
      const refreshed = await crmService.getLead(id)
      setActiveLead((current) => current?.id === id ? refreshed : current)
      toast.success('Follow-up scheduled.')
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not schedule a follow-up.'),
  })

  const exportLeads = useMutation({
    mutationFn: () => crmService.exportLeads(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'leads.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    },
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">CRM PIPELINE</span>
        <h1>Leads</h1>
        <p>Move inquiries through your pipeline and get grounded AI suggestions.</p>
      </header>
      <div className="dashboard-quick-actions">
        <button className="btn btn-outline" type="button" disabled={exportLeads.isPending} onClick={() => exportLeads.mutate()}><Download size={16} />Export CSV</button>
      </div>
      {leads.data?.leads.length ? (
        <div className="lead-table-wrap">
          <table className="lead-table">
            <thead><tr><th>Buyer</th><th>Property</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {leads.data.leads.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.buyer.firstName} {lead.buyer.lastName}</strong><small>{lead.buyer.email}</small></td>
                  <td>{lead.property.title}</td>
                  <td>{lead.message}</td>
                  <td>
                    <select
                      className="field-control"
                      value={lead.status}
                      onChange={(event) => updateStatus.mutate({ id: lead.id, status: event.target.value as LeadStatus })}
                      aria-label={`Status for ${lead.buyer.firstName}`}
                    >
                      {['NEW', 'CONTACTED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'LOST'].map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="lead-actions">
                      <button type="button" className="btn btn-outline btn-small" onClick={() => setActiveLead(lead)}>Details</button>
                      <button type="button" className="btn btn-outline btn-small" disabled={followUp.isPending} onClick={() => followUp.mutate(lead.id)}>Follow up</button>
                      <button type="button" className="btn btn-primary btn-small" onClick={() => assistant.mutate({ leadId: lead.id, task: 'FOLLOW_UP' })}><Sparkles size={14} />Draft</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StatusPanel icon={Users} title="No leads yet" description="Buyer inquiries will arrive here when someone contacts one of your listings." />
      )}
      {activeLead && (
        <section className="dashboard-panel lead-detail">
          <div className="dashboard-panel-header"><h2>{activeLead.buyer.firstName} {activeLead.buyer.lastName}</h2><button className="icon-button" type="button" aria-label="Close lead details" onClick={() => setActiveLead(null)}>×</button></div>
          <p>{activeLead.message}</p>
          <p><strong>Requirements:</strong> {activeLead.requirements ?? 'Not supplied'}</p>
          <p><strong>Budget:</strong> {activeLead.budgetMax ? formatCompactPrice(Number(activeLead.budgetMax)) : 'Not supplied'}</p>
          <div className="lead-actions">
            <button className="btn btn-outline btn-small" type="button" onClick={() => assistant.mutate({ leadId: activeLead.id, task: 'SUMMARIZE' })}>Summarise</button>
            <button className="btn btn-outline btn-small" type="button" onClick={() => assistant.mutate({ leadId: activeLead.id, task: 'QUESTIONS' })}>Questions</button>
            <button className="btn btn-outline btn-small" type="button" onClick={() => assistant.mutate({ leadId: activeLead.id, task: 'PROPERTY_MATCH' })}>Matches</button>
          </div>
          <h3>Activity</h3>
          <form
            className="lead-activity-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (activityNotes.trim().length < 2) return
              addActivity.mutate({ id: activeLead.id, type: activityType, notes: activityNotes.trim() })
            }}
          >
            <select className="field-control" value={activityType} onChange={(event) => setActivityType(event.target.value)} aria-label="Activity type">
              {['NOTE', 'FOLLOW_UP', 'CALL', 'EMAIL', 'WHATSAPP', 'OTHER'].map((type) => <option key={type}>{type}</option>)}
            </select>
            <input className="field-control" value={activityNotes} maxLength={2000} placeholder="Add a note" aria-label="Activity notes" onChange={(event) => setActivityNotes(event.target.value)} />
            <button className="btn btn-outline btn-small" type="submit" disabled={addActivity.isPending || activityNotes.trim().length < 2}><Plus size={14} />Add</button>
          </form>
          {(activities.data ?? activeLead.activities).length ? (
            <div className="dashboard-list">
              {(activities.data ?? activeLead.activities).map((activity) => (
                <div className="dashboard-list-row" key={activity.id}><div><strong>{activity.type}</strong><span>{activity.notes}</span></div><time>{new Date(activity.createdAt).toLocaleString('en-IN')}</time></div>
              ))}
            </div>
          ) : <p className="muted">No activities recorded.</p>}
          {activities.isError && <p className="muted">Live activity feed is unavailable; showing saved activity from this lead.</p>}
        </section>
      )}
    </div>
  )
}
