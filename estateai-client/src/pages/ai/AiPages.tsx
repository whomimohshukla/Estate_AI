import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Bot, Check, LoaderCircle, MessageSquare, Search, Sparkles, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { PropertyCard } from '../../components/common/PropertyCard'
import { StatusPanel } from '../../components/common/StatusPanel'
import { ApiError } from '../../lib/api'
import { formatCompactPrice } from '../../lib/format'
import { aiService } from '../../services/ai.service'
import { propertiesService } from '../../services/properties.service'
import type { AiSearchResult, ChatMessage, ConversationSummary } from '../../types/app'
import './dashboard.css'

const aiSearchSchema = z.object({
  query: z.string().trim().min(4, 'Describe the home you are looking for.'),
})

type AiSearchFormValues = z.infer<typeof aiSearchSchema>

export function AiSearchPage() {
  const [result, setResult] = useState<AiSearchResult | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<AiSearchFormValues>({
    resolver: zodResolver(aiSearchSchema),
    defaultValues: { query: '' },
  })
  const search = useMutation({
    mutationFn: (values: AiSearchFormValues) => aiService.search(values.query),
    onSuccess: (data) => setResult(data),
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Search failed.'),
  })

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">AI DISCOVERY</span>
        <h1>Search in plain language</h1>
        <p>Describe your ideal home. EstateAI extracts strict filters and ranks verified listings by relevance.</p>
      </header>
      <form className="ai-search-form" onSubmit={handleSubmit((values) => search.mutate(values))}>
        <div className="ai-search-input">
          <Search size={20} />
          <input
            className="field-control"
            placeholder="e.g. 2BHK apartment in Noida under 80 lakh with parking"
            aria-label="Natural language property search"
            {...register('query')}
          />
          <button className="btn btn-primary" type="submit" disabled={search.isPending}>
            {search.isPending ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            Search
          </button>
        </div>
        {errors.query && <p className="field-error" role="alert">{errors.query.message}</p>}
      </form>

      {result && (
        <>
          <div className="ai-filter-summary">
            <strong>Understood filters</strong>
            <div>
              {Object.entries(result.interpretedFilters)
                .filter(([, value]) => value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0))
                .map(([key, value]) => (
                  <span className="filter-chip" key={key}>{key}: {Array.isArray(value) ? value.join(', ') : String(value)}</span>
                ))}
              {Object.values(result.interpretedFilters).every((value) => value === null || value === undefined || value === '') && (
                <span className="filter-chip">No strict filters detected</span>
              )}
            </div>
            <span className="ranking-chip">Ranking: {result.ranking}</span>
          </div>
          {result.properties.length ? (
            <div className="property-grid">
              {result.properties.map((property) => <PropertyCard property={property} key={property.id} />)}
            </div>
          ) : (
            <StatusPanel
              icon={Search}
              title="No exact matches"
              description="Try widening your budget or removing an amenity filter."
              action={result.suggestions.length ? (
                <div className="suggestion-list">
                  {result.suggestions.map((property) => (
                    <a href={`/properties/${property.id}`} key={property.id}>{property.title} · {formatCompactPrice(property.price)}</a>
                  ))}
                </div>
              ) : undefined}
            />
          )}
        </>
      )}
    </div>
  )
}

export function ChatPage() {
  const [searchParams] = useSearchParams()
  const propertyId = searchParams.get('propertyId') ?? undefined
  const queryClient = useQueryClient()
  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: () => aiService.listConversations(),
  })
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const send = useMutation({
    mutationFn: () => aiService.chat({ message: input, propertyId, conversationId }),
    onSuccess: async (response) => {
      setMessages((current) => [
        ...current,
        { id: `${response.messageId}-user`, role: 'USER', content: input, createdAt: new Date().toISOString() },
        { id: response.messageId, role: 'ASSISTANT', content: response.answer, createdAt: new Date().toISOString() },
      ])
      setConversationId(response.conversationId)
      setInput('')
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Could not get an answer.'),
  })

  async function openConversation(id: string) {
    setConversationId(id)
    const conversation: ConversationSummary = await aiService.getConversation(id)
    setMessages(conversation.messages)
  }

  return (
    <div className="page-shell dashboard-page chat-page">
      <header className="dashboard-header">
        <span className="eyebrow">PROPERTY ASSISTANT</span>
        <h1>Ask EstateAI</h1>
        <p>Answers are grounded in verified listing facts. Missing information is never invented.</p>
      </header>
      <div className="chat-layout">
        <aside className="chat-conversations">
          <h2>Conversations</h2>
          {conversations.data?.length ? conversations.data.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              className={`conversation-item ${conversationId === conversation.id ? 'active' : ''}`}
              onClick={() => void openConversation(conversation.id)}
            >
              <MessageSquare size={15} />
              <span>{conversation.title ?? 'Property conversation'}</span>
            </button>
          )) : <p className="muted">No conversations yet.</p>}
        </aside>
        <section className="chat-panel">
          <div className="chat-messages">
            {messages.length ? messages.map((message) => (
              <div className={`chat-message ${message.role.toLowerCase()}`} key={message.id}>
                <span>{message.role === 'USER' ? <User size={15} /> : <Bot size={15} />}</span>
                <p>{message.content}</p>
              </div>
            )) : (
              <StatusPanel icon={Bot} title="Start a conversation" description={propertyId ? 'Ask about price, amenities, area, or metro distance for this listing.' : 'Select a property page and use “Ask EstateAI”, or ask a general question.'} />
            )}
          </div>
          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault()
              if (input.trim().length > 1) send.mutate()
            }}
          >
            <input
              className="field-control"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about this property…"
              aria-label="Chat message"
            />
            <button className="btn btn-primary" type="submit" disabled={send.isPending || input.trim().length < 2}>
              {send.isPending ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />}
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export function ComparePage() {
  const listings = useQuery({ queryKey: ['properties', 'compare-options'], queryFn: () => propertiesService.list({ limit: 12 }) })
  const [selected, setSelected] = useState<string[]>([])
  const comparison = useMutation({
    mutationFn: () => aiService.compare(selected),
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Comparison failed.'),
  })

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current)
  }

  return (
    <div className="page-shell dashboard-page">
      <header className="dashboard-header">
        <span className="eyebrow">COMPARE HOMES</span>
        <h1>Choose up to three listings</h1>
        <p>EstateAI compares verified price, area, bedrooms, amenities and metro distance.</p>
      </header>
      <div className="compare-options">
        {listings.data?.properties.map((property) => (
          <button
            type="button"
            key={property.id}
            className={`compare-option ${selected.includes(property.id) ? 'selected' : ''}`}
            onClick={() => toggle(property.id)}
            aria-pressed={selected.includes(property.id)}
          >
            <span className="compare-check">{selected.includes(property.id) && <Check size={14} />}</span>
            <div><strong>{property.title}</strong><small>{property.city} · {formatCompactPrice(property.price)}</small></div>
          </button>
        ))}
      </div>
      <button className="btn btn-primary compare-submit" type="button" disabled={selected.length < 2 || comparison.isPending} onClick={() => comparison.mutate()}>
        <Sparkles size={16} />Compare selected homes
      </button>
      {comparison.data && (
        <section className="comparison-result">
          <h2>Comparison</h2>
          <p>{comparison.data.explanation}</p>
          <div className="comparison-grid">
            {comparison.data.properties.map((property) => (
              <div className="comparison-card" key={property.id}>
                <h3>{property.title}</h3>
                <dl>
                  <div><dt>Price</dt><dd>{formatCompactPrice(property.price)}</dd></div>
                  <div><dt>Area</dt><dd>{property.areaSqFt.toLocaleString('en-IN')} sq ft</dd></div>
                  <div><dt>Price/sq ft</dt><dd>{formatCompactPrice(property.pricePerSqFt)}</dd></div>
                  <div><dt>Bedrooms</dt><dd>{property.bedrooms}</dd></div>
                  <div><dt>Amenities</dt><dd>{property.amenities.join(', ') || 'None'}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
