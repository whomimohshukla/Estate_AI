import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, Compass, Search, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { NaturalLanguageSearch } from '../components/search/NaturalLanguageSearch'
import { PropertyCardSkeleton } from '../components/common/PropertyCardSkeleton'
import { PropertyGrid } from '../components/common/PropertyGrid'
import { StatusPanel } from '../components/common/StatusPanel'
import { useAiPropertySearch, useAiSearchHistory } from '../hooks/useAiSearch'
import { ApiError } from '../lib/api'
import { formatCompactPrice, readableAmenity, readableFurnishing, readablePropertyType } from '../lib/format'
import { useAuthStore } from '../store/auth-store'
import type { InterpretedFilters } from '../types/ai-search'
import './marketplace.css'

function filterPills(filters: InterpretedFilters): string[] {
  const pills: string[] = []
  if (filters.purpose) pills.push(filters.purpose === 'SALE' ? 'For sale' : 'For rent')
  if (filters.propertyType) pills.push(readablePropertyType(filters.propertyType))
  if (filters.city) pills.push(filters.city)
  if (filters.locality) pills.push(filters.locality)
  if (filters.bedrooms !== null && filters.bedrooms !== undefined) pills.push(`${filters.bedrooms} bedrooms`)
  if (filters.bathrooms !== null && filters.bathrooms !== undefined) pills.push(`${filters.bathrooms} bathrooms`)
  if (filters.minPrice !== null && filters.minPrice !== undefined) pills.push(`From ${formatCompactPrice(filters.minPrice)}`)
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) pills.push(`Up to ${formatCompactPrice(filters.maxPrice)}`)
  filters.amenities.forEach((amenity) => pills.push(readableAmenity(amenity)))
  if (filters.parking) pills.push('Parking')
  if (filters.furnishing) pills.push(readableFurnishing(filters.furnishing))
  return pills
}

function SuggestedListing({ id, title, price }: { id: string; title: string; price: number }) {
  return (
    <Link className="search-suggestion-card" to={`/properties/${id}`}>
      <span className="suggestion-icon"><Compass size={17} /></span>
      <span className="suggestion-copy"><strong>{title}</strong><small>Broadened match · {formatCompactPrice(price)}</small></span>
      <ArrowRight size={16} />
    </Link>
  )
}

export function AiSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const user = useAuthStore((state) => state.user)
  const searchEnabled = query.length >= 3
  const search = useAiPropertySearch({ query, page, limit: 9 }, searchEnabled)
  const history = useAiSearchHistory(Boolean(user))
  const filters = useMemo(() => search.data ? filterPills(search.data.interpretedFilters) : [], [search.data])
  const isMissingEndpoint = search.error instanceof ApiError && search.error.status === 404

  function runSearch(nextQuery: string) {
    setSearchParams({ q: nextQuery, page: '1' })
  }

  function selectHistory(queryText: string) {
    setSearchParams({ q: queryText, page: '1' })
  }

  function changePage(nextPage: number) {
    setSearchParams({ q: query, page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function retrySearch() {
    void search.refetch()
    toast.info('Trying your search again…')
  }

  return (
    <div className="ai-search-page">
      <section className="ai-search-hero">
        <div className="ai-search-hero-pattern" aria-hidden="true" />
        <div className="page-shell ai-search-hero-inner">
          <Link to="/" className="search-back-link"><ArrowLeft size={15} />Back home</Link>
          <div className="ai-search-heading">
            <span className="ai-search-eyebrow"><span><Sparkles size={13} /></span> ESTATEAI NATURAL SEARCH</span>
            <h1>Find a home in<br /><em>your own words.</em></h1>
            <p>Tell us what matters — location, budget, the little things. We’ll find the listings that fit.</p>
          </div>
          <NaturalLanguageSearch
            key={query}
            initialQuery={query}
            onSearch={runSearch}
            busy={search.isFetching}
            suggestions={searchEnabled ? [] : undefined}
          />
          <div className="ai-search-trust">
            <span><BadgeCheck size={15} /> Filters interpreted by EstateAI</span>
            <span>Only published property listings are shown</span>
          </div>
        </div>
      </section>

      <section className="page-shell ai-search-content">
        {!searchEnabled ? (
          <div className="search-start-state">
            <span className="search-start-icon"><Search size={22} /></span>
            <h2>Start with the home you have in mind.</h2>
            <p>Try a city, budget, home type, or a few things that would make it feel right.</p>
            {!user && (
              <div className="search-history-login">
                <Clock3 size={15} />
                <span>Sign in to keep your search history.</span>
                <Link to="/login">Log in</Link>
              </div>
            )}
          </div>
        ) : search.isLoading ? (
          <div className="ai-search-loading">
            <div className="search-loading-heading"><span className="search-loading-orb"><Sparkles size={16} /></span><div><strong>Finding homes that fit</strong><span>Understanding your request and searching current listings…</span></div></div>
            <div className="property-grid">{Array.from({ length: 3 }, (_, index) => <PropertyCardSkeleton key={index} />)}</div>
          </div>
        ) : search.isError ? (
          <StatusPanel
            icon={Search}
            title={isMissingEndpoint ? 'Natural-language search is not available on this server' : 'We couldn’t complete that search'}
            description={isMissingEndpoint
              ? 'The configured server did not recognize POST /ai/search. Check the API base URL or backend version.'
              : search.error.message || 'The EstateAI search service had a problem. Your request was not replaced with sample results.'}
            action={<button className="btn btn-outline btn-small" type="button" onClick={retrySearch}>Try again</button>}
          />
        ) : search.data ? (
          <>
            <div className="interpreted-query-card">
              <div className="interpreted-icon"><Sparkles size={17} /></div>
              <div className="interpreted-copy">
                <span>Here’s what we understood</span>
                <strong>“{search.data.query}”</strong>
                {filters.length > 0
                  ? <div className="interpreted-pills">{filters.map((filter) => <span className="interpreted-pill" key={filter}>{filter}</span>)}</div>
                  : <p>We didn’t find specific filters in that wording. Try adding a city, budget, bedroom count, or home feature.</p>}
              </div>
              <button
                type="button"
                className="refine-search-button"
                onClick={() => document.getElementById('search-prompt-compact')?.focus()}
              >
                Refine <span aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="ai-results-header">
              <div>
                <span className="eyebrow">YOUR MATCHES</span>
                <h2>{search.data.meta.total === 0 ? 'A few more possibilities' : `${search.data.meta.total.toLocaleString('en-IN')} homes to explore`}</h2>
                <p>{search.data.ranking === 'hybrid' ? 'Results are ordered by relevance to your request.' : 'Results are matched against the filters we understood.'}</p>
              </div>
              <span className="ranking-badge"><span />{search.data.ranking === 'hybrid' ? 'Relevance ranked' : 'Filter matched'}</span>
            </div>

            {search.data.properties.length ? (
              <>
                <PropertyGrid properties={search.data.properties} scores={search.data.scores} />
                {search.data.meta.totalPages > 1 && (
                  <div className="pagination">
                    <button className="btn btn-outline btn-small" type="button" disabled={!search.data.meta.hasPrevious} onClick={() => changePage(page - 1)}>Previous</button>
                    <span>Page {search.data.meta.page} of {search.data.meta.totalPages}</span>
                    <button className="btn btn-outline btn-small" type="button" disabled={!search.data.meta.hasNext} onClick={() => changePage(page + 1)}>Next<ArrowRight size={14} /></button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-ai-results">
                <div className="no-ai-results-top">
                  <span className="no-results-icon"><Compass size={21} /></span>
                  <div><h3>No exact matches this time</h3><p>We couldn’t find listings matching all those details. Here are nearby possibilities with some requirements relaxed.</p></div>
                </div>
                {search.data.suggestions.length > 0 ? (
                  <div className="search-suggestion-list">
                    {search.data.suggestions.map((suggestion) => <SuggestedListing key={suggestion.id} {...suggestion} />)}
                  </div>
                ) : (
                  <p className="no-suggestions">No broader listings are available just yet. Try another location or budget.</p>
                )}
              </div>
            )}
          </>
        ) : null}

        {user && history.data && history.data.length > 0 && (
          <section className="search-history-section">
            <div className="search-history-title"><Clock3 size={16} /><h2>Recent searches</h2></div>
            <div className="search-history-list">
              {history.data.slice(0, 5).map((item) => (
                <button type="button" key={item.id} onClick={() => selectHistory(item.query)}>
                  <span>{item.query}</span><small>{item.resultCount} homes</small>
                </button>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  )
}
