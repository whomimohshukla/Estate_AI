import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Bath, BedDouble, Check, ChevronLeft, ChevronRight, Flag, House, ImageOff, MapPin, Ruler, Send, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PropertyCard } from '../components/common/PropertyCard'
import { PropertyCardSkeleton } from '../components/common/PropertyCardSkeleton'
import { StatusPanel } from '../components/common/StatusPanel'
import { useProperties, useProperty } from '../hooks/useProperties'
import { ApiError } from '../lib/api'
import { formatPrice, readableAmenity, readableFurnishing, readablePropertyType } from '../lib/format'
import { crmService } from '../services/crm.service'
import { useAuthStore } from '../store/auth-store'
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
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('INCORRECT_LISTING_DETAILS')
  const [reportDetails, setReportDetails] = useState('')
  const { data: property, isLoading, isError, error, refetch } = useProperty(id)
  const { data: similarData, isLoading: similarLoading } = useProperties({
    city: property?.city,
    purpose: property?.purpose,
    propertyType: property?.propertyType,
    limit: 3,
    sortBy: 'createdAt',
  }, Boolean(property))
  const detailError = error instanceof ApiError ? error : null
  const createLead = useMutation({
    mutationFn: () => crmService.createLead({ propertyId: id, message: inquiryMessage }),
    onSuccess: () => {
      setInquiryOpen(false)
      setInquiryMessage('')
      toast.success('Your inquiry was sent to the listing agent.')
    },
    onError: (mutationError: unknown) => {
      toast.error(mutationError instanceof ApiError ? mutationError.message : 'Could not send your inquiry.')
    },
  })

  const createReport = useMutation({
    mutationFn: () => crmService.createReport({
      propertyId: id,
      reason: reportReason,
      details: reportDetails.trim() || undefined,
    }),
    onSuccess: () => {
      setReportOpen(false)
      setReportDetails('')
      toast.success('Thank you. Our team will review this listing.')
    },
    onError: (mutationError: unknown) => toast.error(mutationError instanceof ApiError ? mutationError.message : 'Could not submit your report.'),
  })

  function openInquiry() {
    if (!user) {
      navigate('/login', { state: { from: `/properties/${id}` } })
      return
    }
    setInquiryOpen(true)
  }

  function openReport() {
    if (!user) {
      navigate('/login', { state: { from: `/properties/${id}` } })
      return
    }
    setReportOpen(true)
  }

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
            <div><ShieldCheck size={18} /><strong>Listing details from Estate</strong></div>
            <p>Specifications and amenities are shown as provided in the published property listing.</p>
          </section>
        </article>

        <aside className="detail-sidebar">
          <div className="inquiry-card">
            <span className="eyebrow">Interested in this home?</span>
            <h2>Take the next step.</h2>
            <p>Connect with the listing agent to ask a question or arrange a visit.</p>
            <button className="btn btn-primary inquiry-button" type="button" onClick={openInquiry}>
              Contact agent <ArrowRight size={16} />
            </button>
            <div className="integration-note"><ShieldCheck size={15} />Your inquiry goes to the agent managing this verified listing.</div>
          </div>
          <div className="detail-side-facts">
            <div><span>Price per sq ft</span><strong>{formatPrice(property.pricePerSqFt)}</strong></div>
            <div><span>Furnishing</span><strong>{readableFurnishing(property.furnishing)}</strong></div>
            <div><span>Listing purpose</span><strong>{property.purpose === 'SALE' ? 'For sale' : 'For rent'}</strong></div>
          </div>
          <Link className="assistant-teaser" to={`/buyer/chat?propertyId=${encodeURIComponent(property.id)}`}>
            <Sparkles size={18} />
            <div><strong>Ask Estate</strong><p>Get grounded answers from this listing’s verified facts.</p></div>
            <ArrowRight size={16} />
          </Link>
          <button className="btn btn-outline btn-small report-listing-button" type="button" onClick={openReport}><Flag size={16} />Report this listing</button>
        </aside>
      </div>

      {inquiryOpen && (
        <div className="inquiry-modal-backdrop" role="presentation" onClick={() => setInquiryOpen(false)}>
          <div className="inquiry-modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close inquiry" onClick={() => setInquiryOpen(false)}><X size={18} /></button>
            <span className="eyebrow">CONTACT THE AGENT</span>
            <h2 id="inquiry-title">Ask about {property.title}</h2>
            <p>Write a short message. The agent will see it in their lead pipeline.</p>
            <textarea
              className="field-control"
              rows={5}
              value={inquiryMessage}
              maxLength={2000}
              placeholder="I’m interested in this property. Is a site visit possible this week?"
              onChange={(event) => setInquiryMessage(event.target.value)}
            />
            <div className="inquiry-modal-actions">
              <button className="btn btn-outline btn-small" type="button" onClick={() => setInquiryOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-small"
                type="button"
                disabled={inquiryMessage.trim().length < 5 || createLead.isPending}
                onClick={() => createLead.mutate()}
              >
                <Send size={15} />{createLead.isPending ? 'Sending…' : 'Send inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="inquiry-modal-backdrop" role="presentation" onClick={() => setReportOpen(false)}>
          <div className="inquiry-modal" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close report form" onClick={() => setReportOpen(false)}><X size={18} /></button>
            <span className="eyebrow">REPORT A LISTING</span>
            <h2 id="report-title">Help us keep listings accurate</h2>
            <p>Tell us what needs attention. Reports are reviewed by the Estate team.</p>
            <select className="field-control" value={reportReason} onChange={(event) => setReportReason(event.target.value)} aria-label="Report reason">
              <option value="INCORRECT_LISTING_DETAILS">Incorrect listing details</option>
              <option value="MISLEADING_INFORMATION">Misleading information</option>
              <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
              <option value="POSSIBLE_SCAM">Possible scam</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea
              className="field-control"
              rows={4}
              maxLength={2000}
              value={reportDetails}
              placeholder="Add any details that will help our review team"
              onChange={(event) => setReportDetails(event.target.value)}
            />
            <div className="inquiry-modal-actions">
              <button className="btn btn-outline btn-small" type="button" onClick={() => setReportOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-small" type="button" disabled={createReport.isPending} onClick={() => createReport.mutate()}>
                <Flag size={15} />{createReport.isPending ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}

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
