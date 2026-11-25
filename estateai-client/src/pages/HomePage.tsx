import { ArrowRight, ArrowUpRight, Home, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PropertyCardSkeleton } from '../components/common/PropertyCardSkeleton'
import { PropertyGrid } from '../components/common/PropertyGrid'
import { TypewriterText } from '../components/common/TypewriterText'
import { NaturalLanguageSearch } from '../components/search/NaturalLanguageSearch'
import { StatusPanel } from '../components/common/StatusPanel'
import { useProperties } from '../hooks/useProperties'
import './marketplace.css'

const citySuggestions = ['Noida', 'Delhi', 'Gurugram', 'Bengaluru']
const searchExamples = [
  'A 3 BHK near metro in Noida',
  'Furnished 2 BHK for rent in Delhi',
  'A family home with parking and a garden',
]

export function HomePage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useProperties({
    limit: 3,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  function searchProperties(query: string) {
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-image" aria-hidden="true" />
        <div className="page-shell hero-content">
          <div className="hero-copy">
            <span className="hero-kicker"><span /> Property search, in your own words</span>
            <h1>Say what you need.<br /><em>Find where you belong.</em></h1>
            <p>Tell EstateAI about your budget, the neighbourhood, or the little things you care about. We’ll search real listings for the right fit.</p>
            <div className="hero-example">
              <span className="hero-example-label">TRY A SEARCH</span>
              <span className="hero-example-text"><TypewriterText phrases={searchExamples} /><i aria-hidden="true" /></span>
              <span className="sr-only">Examples show the kinds of natural-language property searches EstateAI can understand.</span>
            </div>
            <div className="hero-proof">
              <span><Sparkles size={16} /> Natural-language discovery</span>
              <span><ShieldCheck size={16} /> Published property listings</span>
            </div>
          </div>
          <NaturalLanguageSearch onSearch={searchProperties} />
          <div className="hero-image-credit">One request. A more thoughtful shortlist.</div>
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
              <p>Start with a city, then tell EstateAI the kind of place you have in mind.</p>
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
            { label: 'Commercial', value: 'COMMERCIAL', detail: 'Spaces for work and opportunity' },
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
            <h2>Your words become a smarter search.</h2>
            <p>EstateAI interprets your requirements, applies trusted property filters, then ranks available homes against your request.</p>
          </div>
          <Link className="btn btn-outline" to="/search"><Search size={16} />Try natural search <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section id="how-it-works" className="page-shell how-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Simple by design</span>
            <h2>From your words to your next home.</h2>
            <p>No complicated filters to start. Describe the home you need and EstateAI takes it from there.</p>
          </div>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <span className="step-label">YOU DESCRIBE IT</span>
            <h3>Say what matters to you</h3>
            <p>Type naturally: “A 2 BHK in Noida under ₹80 lakh, near the metro.”</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <span className="step-label">ESTATEAI UNDERSTANDS</span>
            <h3>Your words become useful filters</h3>
            <p>EstateAI reads your location, budget and needs, then searches current property listings.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <span className="step-label">YOU EXPLORE</span>
            <h3>Compare homes that fit</h3>
            <p>Review ranked matches, see the details, save favourites, and contact the listing agent.</p>
          </article>
        </div>
      </section>
    </>
  )
}
