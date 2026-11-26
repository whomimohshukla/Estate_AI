import { ArrowLeft, ArrowRight, ListFilter, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PropertyCardSkeleton } from '../components/common/PropertyCardSkeleton'
import { PropertyGrid } from '../components/common/PropertyGrid'
import { StatusPanel } from '../components/common/StatusPanel'
import { useProperties } from '../hooks/useProperties'
import { ApiError } from '../lib/api'
import { PROPERTY_AMENITIES, PROPERTY_TYPES, type PropertyFilters } from '../types/property'
import './marketplace.css'

function readFilters(params: URLSearchParams): PropertyFilters {
  const selectedAmenities = new Set((params.get('amenities') ?? '').split(','))
  const amenities = PROPERTY_AMENITIES.filter((amenity) => selectedAmenities.has(amenity))
  const propertyType = params.get('propertyType')
  const purpose = params.get('purpose')
  const sortBy = params.get('sortBy')
  const sortOrder = params.get('sortOrder')

  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    limit: 9,
    city: params.get('city') || undefined,
    locality: params.get('locality') || undefined,
    q: params.get('q') || undefined,
    propertyType: PROPERTY_TYPES.find((type) => type === propertyType),
    purpose: purpose === 'SALE' ? 'SALE' : purpose === 'RENT' ? 'RENT' : undefined,
    minPrice: Number(params.get('minPrice')) || undefined,
    maxPrice: Number(params.get('maxPrice')) || undefined,
    bedrooms: params.has('bedrooms') ? Number(params.get('bedrooms')) : undefined,
    bathrooms: params.has('bathrooms') ? Number(params.get('bathrooms')) : undefined,
    minArea: Number(params.get('minArea')) || undefined,
    maxArea: Number(params.get('maxArea')) || undefined,
    amenities,
    parking: params.get('parking') === 'true' ? true : undefined,
    furnishing: ['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED'].includes(params.get('furnishing') ?? '')
      ? params.get('furnishing') as PropertyFilters['furnishing']
      : undefined,
    sortBy: ['createdAt', 'price', 'areaSqFt', 'bedrooms'].includes(sortBy ?? '')
      ? sortBy as PropertyFilters['sortBy']
      : 'createdAt',
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
  }
}

function buildParams(values: FormData, current: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams()
  const textFields = ['city', 'locality', 'q', 'propertyType', 'purpose', 'furnishing', 'sortBy', 'sortOrder']
  textFields.forEach((field) => {
    const value = String(values.get(field) ?? '').trim()
    if (value) params.set(field, value)
  })
  ;['minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'minArea', 'maxArea'].forEach((field) => {
    const value = String(values.get(field) ?? '').trim()
    if (value) params.set(field, value)
  })
  const amenities = values.getAll('amenities').map(String)
  if (amenities.length) params.set('amenities', amenities.join(','))
  if (values.get('parking') === 'on') params.set('parking', 'true')
  params.set('page', '1')
  if (!params.has('sortBy')) params.set('sortBy', current.sortBy ?? 'createdAt')
  if (!params.has('sortOrder')) params.set('sortOrder', current.sortOrder ?? 'desc')
  return params
}

export function PropertyListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const { data, isLoading, isError, error, refetch } = useProperties(filters)
  const queryError = error instanceof ApiError ? error : null
  const isMissingEndpoint = queryError?.status === 404

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const minPrice = Number(formData.get('minPrice'))
    const maxPrice = Number(formData.get('maxPrice'))
    const minArea = Number(formData.get('minArea'))
    const maxArea = Number(formData.get('maxArea'))
    if ((minPrice && maxPrice && minPrice > maxPrice) || (minArea && maxArea && minArea > maxArea)) {
      toast.error('Minimum values can’t be greater than maximum values.')
      return
    }
    setSearchParams(buildParams(formData, filters))
    toast.success('Your filters have been applied.')
  }

  function changePage(page: number) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="listing-page page-shell">
      <div className="listing-heading">
        <div>
          <span className="eyebrow">Estate marketplace</span>
          <h1>Find a place to call home.</h1>
          <p>Explore property listings currently available on Estate.</p>
        </div>
        <button type="button" className="btn btn-outline mobile-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal size={16} />Filters
        </button>
      </div>
      <div className="listing-layout">
        <aside className={`filters-sidebar ${filtersOpen ? 'filters-open' : ''}`}>
          <div className="filters-title"><span><ListFilter size={17} />Filters</span><button type="button" onClick={() => { setSearchParams({}); toast.info('Filters cleared.') }}>Clear all</button></div>
          <form key={searchParams.toString()} onSubmit={applyFilters}>
            <label className="filter-field">
              <span className="field-label">Search</span>
              <span className="search-control"><Search size={16} /><input className="field-control" name="q" defaultValue={filters.q} placeholder="Title or keyword" /></span>
            </label>
            <label className="filter-field">
              <span className="field-label">City</span>
              <input className="field-control" name="city" defaultValue={filters.city} placeholder="e.g. Noida" />
            </label>
            <label className="filter-field">
              <span className="field-label">Locality</span>
              <input className="field-control" name="locality" defaultValue={filters.locality} placeholder="Neighbourhood" />
            </label>
            <div className="filter-field">
              <span className="field-label">Listing type</span>
              <select className="field-control" name="purpose" defaultValue={filters.purpose ?? ''}>
                <option value="">Buy or rent</option>
                <option value="SALE">For sale</option>
                <option value="RENT">For rent</option>
              </select>
            </div>
            <div className="filter-field">
              <span className="field-label">Property type</span>
              <select className="field-control" name="propertyType" defaultValue={filters.propertyType ?? ''}>
                <option value="">All types</option>
                {PROPERTY_TYPES.map((type) => <option value={type} key={type}>{type.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (value) => value.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <span className="field-label">Budget (₹)</span>
              <div className="two-fields">
                <input className="field-control" name="minPrice" type="number" min="0" defaultValue={filters.minPrice} placeholder="Min" />
                <input className="field-control" name="maxPrice" type="number" min="0" defaultValue={filters.maxPrice} placeholder="Max" />
              </div>
            </div>
            <div className="two-fields">
              <label className="filter-field">
                <span className="field-label">Bedrooms</span>
                <select className="field-control" name="bedrooms" defaultValue={filters.bedrooms ?? ''}>
                  <option value="">Any</option>
                  {[0, 1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number}</option>)}
                </select>
              </label>
              <label className="filter-field">
                <span className="field-label">Bathrooms</span>
                <select className="field-control" name="bathrooms" defaultValue={filters.bathrooms ?? ''}>
                  <option value="">Any</option>
                  {[0, 1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number}</option>)}
                </select>
              </label>
            </div>
            <div className="filter-field">
              <span className="field-label">Area (sq ft)</span>
              <div className="two-fields">
                <input className="field-control" name="minArea" type="number" min="0" defaultValue={filters.minArea} placeholder="Min" />
                <input className="field-control" name="maxArea" type="number" min="0" defaultValue={filters.maxArea} placeholder="Max" />
              </div>
            </div>
            <label className="filter-field">
              <span className="field-label">Furnishing</span>
              <select className="field-control" name="furnishing" defaultValue={filters.furnishing ?? ''}>
                <option value="">Any furnishing</option>
                <option value="UNFURNISHED">Unfurnished</option>
                <option value="SEMI_FURNISHED">Semi furnished</option>
                <option value="FURNISHED">Furnished</option>
              </select>
            </label>
            <div className="filter-field">
              <span className="field-label">Amenities</span>
              <div className="amenity-checks">
                {(['PARKING', 'GYM', 'SECURITY', 'LIFT', 'SWIMMING_POOL'] as const).map((amenity) => (
                  <label key={amenity}><input type="checkbox" name="amenities" value={amenity} defaultChecked={filters.amenities?.includes(amenity)} />{amenity.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (value) => value.toUpperCase())}</label>
                ))}
              </div>
            </div>
            <label className="parking-check"><input type="checkbox" name="parking" defaultChecked={filters.parking} />Parking available</label>
            <button type="submit" className="btn btn-primary filter-submit"><Search size={16} />Show homes</button>
          </form>
        </aside>

        <section className="listing-results" aria-live="polite">
          <div className="results-toolbar">
            <p>{data?.meta ? <><strong>{data.meta.total.toLocaleString('en-IN')}</strong> homes found</> : 'Homes matching your search'}</p>
            <label className="sort-control"><span>Sort by</span>
              <select
                className="field-control"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(event) => {
                  const [sortBy, sortOrder] = event.target.value.split('-')
                  const params = new URLSearchParams(searchParams)
                  params.set('sortBy', sortBy)
                  params.set('sortOrder', sortOrder)
                  params.set('page', '1')
                  setSearchParams(params)
                }}
              >
                <option value="createdAt-desc">Newest first</option>
                <option value="price-desc">Price: high to low</option>
                <option value="price-asc">Price: low to high</option>
                <option value="areaSqFt-desc">Largest area</option>
                <option value="bedrooms-desc">Most bedrooms</option>
              </select>
            </label>
          </div>
          {isLoading ? (
            <div className="property-grid">
              {Array.from({ length: 6 }, (_, index) => <PropertyCardSkeleton key={index} />)}
            </div>
          ) : isError ? (
            <StatusPanel
              icon={Search}
              title={isMissingEndpoint ? 'Property search is not available yet' : 'Listings could not be loaded'}
              description={isMissingEndpoint
                ? 'The configured server did not recognize GET /properties. Check the API base URL or the backend deployment.'
                : error.message || 'Please try again in a moment.'}
              action={isMissingEndpoint ? undefined : <button className="btn btn-outline btn-small" onClick={() => void refetch()}>Try again</button>}
            />
          ) : data?.properties.length ? (
            <>
              <PropertyGrid properties={data.properties} />
              {data.meta && data.meta.totalPages > 1 && (
                <div className="pagination">
                  <button className="btn btn-outline btn-small" disabled={!data.meta.hasPrevious} onClick={() => changePage(filters.page! - 1)}><ArrowLeft size={15} />Previous</button>
                  <span>Page {data.meta.page} of {data.meta.totalPages}</span>
                  <button className="btn btn-outline btn-small" disabled={!data.meta.hasNext} onClick={() => changePage(filters.page! + 1)}>Next<ArrowRight size={15} /></button>
                </div>
              )}
            </>
          ) : (
            <StatusPanel
              icon={Search}
              title="No homes match those filters"
              description="Try widening your budget, choosing a nearby locality, or clearing a filter."
              action={<button className="btn btn-outline btn-small" onClick={() => setSearchParams({})}>Clear filters</button>}
            />
          )}
        </section>
      </div>
    </div>
  )
}
