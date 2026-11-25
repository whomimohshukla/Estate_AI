import { ArrowRight, ArrowUpRight, Compass, Home, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PropertyCardSkeleton } from '../components/common/PropertyCardSkeleton'
import { PropertyGrid } from '../components/common/PropertyGrid'
import { StatusPanel } from '../components/common/StatusPanel'
import { useProperties } from '../hooks/useProperties'
import type { ListingPurpose } from '../types/property'
import './marketplace.css'

const citySuggestions = ['Noida', 'Delhi', 'Gurugram', 'Bengaluru']

export function HomePage() {
  const [city, setCity] = useState('')
  const [purpose, setPurpose] = useState<ListingPurpose>('SALE')
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useProperties({
    limit: 3,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  function searchProperties(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    params.set('purpose', purpose)
    navigate(`/properties?${params.toString()}`)
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-image" aria-hidden="true" />
        <div className="page-shell hero-content">
          <div className="hero-copy">
            <span className="hero-kicker"><span /> Find a place that feels like yours</span>
            <h1>Good homes.<br /><em>Better beginnings.</em></h1>
            <p>Discover thoughtfully listed homes and make your next move with more confidence.</p>
            <div className="hero-proof">
              <span><ShieldCheck size={16} /> Listings reviewed by our team</span>
              <span><Compass size={16} /> Search built around you</span>
            </div>
          </div>
          <form className="hero-search" onSubmit={searchProperties}>
            <div className="search-tabs" aria-label="Listing purpose">
              <button type="button" className={purpose === 'SALE' ? 'active' : ''} onClick={() => setPurpose('SALE')}>Buy</button>
              <button type="button" className={purpose === 'RENT' ? 'active' : ''} onClick={() => setPurpose('RENT')}>Rent</button>
            </div>
            <label className="hero-search-label" htmlFor="hero-city">Where do you want to live?</label>
            <div className="hero-search-row">
              <div className="hero-location-input">
                <MapPin size={18} />
                <input
                  id="hero-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="City or neighbourhood"
                  aria-label="City or neighbourhood"
                />
              </div>
              <button type="submit" className="btn btn-primary"><Search size={17} />Explore homes</button>
            </div>
            <div className="popular-searches">
              <span>Popular:</span>
              {citySuggestions.slice(0, 3).map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setCity(suggestion)}>{suggestion}</button>
              ))}
            </div>
          </form>
          <div className="hero-image-credit">A calmer way to find your next place</div>
        </div>
      </section>

      <section className="page-shell featured-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A good place to start</span>
            <h2>Recently listed homes</h2>
            <p>Explore homes currently available through EstateAI.</p>
          </div>
          <Link className="text-link" to="/properties">View all homes <ArrowRight size={16} /></Link>
        </div>
        {isLoading ? (
          <div className="property-grid">
            {Array.from({ length: 3 }, (_, index) => <PropertyCardSkeleton key={index} />)}
          </div>
        ) : isError ? (
          <StatusPanel
            icon={Home}
            title="Homes aren't loading right now"
            description={error.message || 'Check your connection to the EstateAI API and try again.'}
            action={<button className="btn btn-outline btn-small" onClick={() => void refetch()}>Try again</button>}
          />
        ) : data?.properties.length ? (
          <PropertyGrid properties={data.properties} />
        ) : (
          <StatusPanel
            icon={Home}
            title="New homes are on their way"
            description="There are no published listings yet. Check back soon or browse by location."
            action={<Link className="btn btn-outline btn-small" to="/properties">Browse listings <ArrowRight size={15} /></Link>}
          />
        )}
      </section>

      <section className="city-section">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Start with a place</span>
              <h2>Explore by city</h2>
              <p>Search what is actually listed, with no made-up availability or counts.</p>
            </div>
          </div>
          <div className="city-grid">
            {citySuggestions.map((name, index) => (
              <Link className={`city-card city-card-${index + 1}`} to={`/properties?city=${encodeURIComponent(name)}`} key={name}>
                <span className="city-index">0{index + 1}</span>
                <span className="city-name">{name}</span>
                <span className="city-open">Explore homes <ArrowUpRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Find your kind of space</span>
            <h2>Browse by home type</h2>
          </div>
        </div>
        <div className="category-grid">
          {[
            { label: 'Apartments', value: 'APARTMENT', detail: 'A little less upkeep, a lot more life' },
            { label: 'Independent homes', value: 'HOUSE', detail: 'Room to make it your own' },
            { label: 'Villas', value: 'VILLA', detail: 'Space for the way you live' },
            { label: 'Land & plots', value: 'PLOT', detail: 'A blank canvas for what is next' },
          ].map((category, index) => (
            <Link className="category-card" to={`/properties?propertyType=${category.value}`} key={category.value}>
              <span className={`category-icon category-icon-${index + 1}`}><Home size={21} strokeWidth={1.6} /></span>
              <span className="category-title">{category.label}</span>
              <span className="category-detail">{category.detail}</span>
              <ArrowUpRight className="category-arrow" size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="ai-discovery-section">
        <div className="page-shell ai-discovery-inner">
          <div className="ai-discovery-mark"><Sparkles size={20} /></div>
          <div>
            <span className="eyebrow">A more natural way to search</span>
            <h2>Tell us what home means to you.</h2>
            <p>Natural-language property discovery is being connected to the EstateAI AI search API. Until then, explore verified listings with the filters above.</p>
          </div>
          <Link className="btn btn-outline" to="/properties">Browse available homes <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section id="how-it-works" className="page-shell how-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A little more clarity at every step</span>
            <h2>Finding home, made more human.</h2>
          </div>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Start with what matters</h3>
            <p>Search by location and the details that shape your everyday life.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Get the full picture</h3>
            <p>See each listing's specifications, amenities and images in one place.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Choose with confidence</h3>
            <p>Explore available homes and make your next move at your own pace.</p>
          </article>
        </div>
      </section>
    </>
  )
}
