import { ArrowLeft, ArrowRight, Bath, BedDouble, Check, ChevronLeft, ChevronRight, House, ImageOff, MapPin, Ruler, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PropertyCard } from '../components/common/PropertyCard'
import { PropertyCardSkeleton } from '../components/common/PropertyCardSkeleton'
import { StatusPanel } from '../components/common/StatusPanel'
import { useProperties, useProperty } from '../hooks/useProperties'
import { ApiError } from '../lib/api'
import { formatPrice, readableAmenity, readableFurnishing, readablePropertyType } from '../lib/format'
import type { Property } from '../types/property'
import './marketplace.css'

function PropertyGallery({ property }: { property: Property }) {
  const orderedImages = [...property.images].sort((a, b) => a.position - b.position)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedImage = orderedImages[selectedIndex]

  function changeImage(direction: -1 | 1) {
    setSelectedIndex((current) => (current + direction + orderedImages.length) % orderedImages.length)
  }

  return (
    <div className="detail-gallery">
      {selectedImage ? (
        <div className="gallery-main">
          <img src={selectedImage.url} alt={selectedImage.altText ?? property.title} />
          {orderedImages.length > 1 && (
            <>
              <button className="gallery-arrow gallery-previous" type="button" aria-label="Previous image" onClick={() => changeImage(-1)}><ChevronLeft size={21} /></button>
              <button className="gallery-arrow gallery-next" type="button" aria-label="Next image" onClick={() => changeImage(1)}><ChevronRight size={21} /></button>
              <span className="gallery-counter">{selectedIndex + 1} / {orderedImages.length}</span>
            </>
          )}
        </div>
      ) : (
        <div className="gallery-main gallery-empty"><ImageOff size={28} /><span>Images for this listing are not available</span></div>
      )}
      {orderedImages.length > 1 && (
        <div className="gallery-thumbnails">
          {orderedImages.map((image, index) => (
            <button
              key={image.id}
              className={`gallery-thumb ${index === selectedIndex ? 'selected' : ''}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === selectedIndex}
            >
              <img src={image.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyFacts({ property }: { property: Property }) {
  const facts = [
    { icon: BedDouble, label: 'Bedrooms', value: `${property.bedrooms}` },
    { icon: Bath, label: 'Bathrooms', value: `${property.bathrooms}` },
    { icon: Ruler, label: 'Area', value: `${property.areaSqFt.toLocaleString('en-IN')} sq ft` },
    { icon: House, label: 'Type', value: readablePropertyType(property.propertyType) },
  ]

  return (
    <div className="detail-facts">
      {facts.map(({ icon: Icon, label, value }) => (
        <div className="detail-fact" key={label}>
          <Icon size={18} />
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

export function PropertyDetailsPage() {
  const { id = '' } = useParams()
  const { data: property, isLoading, isError, error, refetch } = useProperty(id)
  const { data: similarData, isLoading: similarLoading } = useProperties({
    city: property?.city,
    purpose: property?.purpose,
    propertyType: property?.propertyType,
    limit: 3,
    sortBy: 'createdAt',
  }, Boolean(property))
  const detailError = error instanceof ApiError ? error : null

  if (isLoading) {
    return (
      <div className="page-shell detail-loading">
        <div className="skeleton skeleton-detail-image" />
        <div className="skeleton-content">
          <div className="skeleton skeleton-line title" />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line wide" />
        </div>
      </div>
    )
  }

  if (isError || !property) {
    return (
      <section className="page-shell detail-error">
        <Link className="back-link" to="/properties"><ArrowLeft size={16} />Back to homes</Link>
        <StatusPanel
          icon={ImageOff}
          title={detailError?.status === 404 ? 'This home is no longer available' : 'We couldn’t load this listing'}
          description={error?.message ?? 'The property may have been removed or the server is temporarily unavailable.'}
          action={detailError?.status === 404
            ? <Link className="btn btn-primary" to="/properties">Explore other homes</Link>
            : <button className="btn btn-outline btn-small" onClick={() => void refetch()}>Try again</button>}
        />
      </section>
    )
  }

  const amenities = property.amenities.map(readableAmenity)

  return (
    <div className="page-shell property-detail-page">
      <div className="detail-breadcrumb"><Link to="/properties"><ArrowLeft size={15} />All homes</Link><span>/</span><span>{property.city}</span></div>
      <PropertyGallery key={property.id} property={property} />
      <div className="detail-layout">
        <article className="detail-main">
          <div className="detail-title-row">
            <div>
              <div className="detail-badges">
                <span className="listing-badge-inline">{property.purpose === 'SALE' ? 'For sale' : 'For rent'}</span>
                <span className="property-category">{readablePropertyType(property.propertyType)}</span>
              </div>
              <h1>{property.title}</h1>
              <p className="detail-address"><MapPin size={16} />{property.address}, {property.locality}, {property.city}, {property.state}</p>
            </div>
            <div className="detail-price">{formatPrice(property.price)}{property.purpose === 'RENT' && <small>/ month</small>}</div>
          </div>

          <section className="detail-section">
            <h2>At a glance</h2>
            <PropertyFacts property={property} />
          </section>

          <section className="detail-section">
            <h2>About this home</h2>
            <p className="property-description">{property.description}</p>
          </section>

          <section className="detail-section">
            <h2>Features & amenities</h2>
            <div className="amenity-list">
              {amenities.length ? amenities.map((amenity) => <span key={amenity}><Check size={15} />{amenity}</span>) : <p>No amenities have been listed for this home.</p>}
              <span><Check size={15} />{readableFurnishing(property.furnishing)}</span>
              {property.parking && <span><Check size={15} />Parking</span>}
              {property.metroDistanceKm !== null && <span><Check size={15} />{property.metroDistanceKm} km to metro</span>}
            </div>
          </section>

          <section className="detail-section detail-context-note">
            <div><ShieldCheck size={18} /><strong>Listing details from EstateAI</strong></div>
            <p>Specifications and amenities are shown as provided in the published property listing.</p>
          </section>
        </article>

        <aside className="detail-sidebar">
          <div className="inquiry-card">
            <span className="eyebrow">Interested in this home?</span>
            <h2>Take the next step.</h2>
            <p>Connect with the listing agent to ask a question or arrange a visit.</p>
            <button className="btn btn-primary inquiry-button" type="button" disabled title="Inquiry endpoint is not yet available">
              Contact agent <ArrowRight size={16} />
            </button>
            <div className="integration-note"><ShieldCheck size={15} />Agent contact and inquiry submission will be enabled when the backend contract is available.</div>
          </div>
          <div className="detail-side-facts">
            <div><span>Price per sq ft</span><strong>{formatPrice(property.pricePerSqFt)}</strong></div>
            <div><span>Furnishing</span><strong>{readableFurnishing(property.furnishing)}</strong></div>
            <div><span>Listing purpose</span><strong>{property.purpose === 'SALE' ? 'For sale' : 'For rent'}</strong></div>
          </div>
          <div className="assistant-teaser">
            <Sparkles size={18} />
            <div><strong>Have a question?</strong><p>The property assistant is waiting on the backend chat API.</p></div>
          </div>
        </aside>
      </div>

      <section className="similar-section">
        <div className="section-heading">
          <div><span className="eyebrow">Keep exploring</span><h2>Similar homes</h2></div>
          <Link className="text-link" to={`/properties?city=${encodeURIComponent(property.city)}&purpose=${property.purpose}`}>Browse in {property.city}<ChevronRight size={16} /></Link>
        </div>
        {similarLoading ? (
          <div className="property-grid">{Array.from({ length: 3 }, (_, index) => <PropertyCardSkeleton key={index} />)}</div>
        ) : similarData?.properties.filter((item) => item.id !== property.id).length ? (
          <div className="property-grid">
            {similarData.properties.filter((item) => item.id !== property.id).slice(0, 3).map((item) => <PropertyCard key={item.id} property={item} />)}
          </div>
        ) : (
          <p className="similar-empty">No other similar listings are available right now.</p>
        )}
      </section>
    </div>
  )
}
