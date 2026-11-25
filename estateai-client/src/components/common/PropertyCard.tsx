import { ArrowUpRight, Bath, BedDouble, Heart, HeartHandshake, ImageOff, MapPin, Ruler } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { formatCompactPrice, readablePropertyType } from '../../lib/format'
import type { Property } from '../../types/property'

interface PropertyCardProps {
  property: Property
  compact?: boolean
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const cover = property.images.find((image) => image.isCover) ?? property.images[0]

  return (
    <article className={`property-card ${compact ? 'property-card-compact' : ''}`}>
      <Link to={`/properties/${property.id}`} className="property-image-link" aria-label={`View ${property.title}`}>
        <div className="property-image">
          {cover ? (
            <img src={cover.url} alt={cover.altText ?? property.title} loading="lazy" />
          ) : (
            <div className="image-placeholder"><ImageOff size={23} /><span>Image unavailable</span></div>
          )}
          <span className="listing-badge">{property.purpose === 'SALE' ? 'For sale' : 'For rent'}</span>
        </div>
      </Link>
      <div className="property-card-content">
        <div className="property-card-topline">
          <span className="property-category">{readablePropertyType(property.propertyType)}</span>
          <button
            type="button"
            className="favorite-button"
            aria-label={`Save ${property.title}`}
            title="Save this home"
            onClick={() => toast.info('Saved homes are coming soon. The current EstateAI API does not include favorites yet.', { icon: <HeartHandshake size={16} /> })}
          >
            <Heart size={17} />
          </button>
        </div>
        <Link to={`/properties/${property.id}`} className="property-card-title">
          {property.title}
        </Link>
        <p className="property-location"><MapPin size={14} />{property.locality}, {property.city}</p>
        <div className="property-facts">
          <span><BedDouble size={15} />{property.bedrooms} beds</span>
          <span><Bath size={15} />{property.bathrooms} baths</span>
          <span><Ruler size={14} />{property.areaSqFt.toLocaleString('en-IN')} sq ft</span>
        </div>
        <div className="property-card-bottom">
          <strong>{formatCompactPrice(property.price)}{property.purpose === 'RENT' && <small>/mo</small>}</strong>
          <Link className="card-link" to={`/properties/${property.id}`} aria-label={`View details for ${property.title}`}>
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  )
}
