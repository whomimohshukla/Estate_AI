import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Bath, BedDouble, Heart, ImageOff, MapPin, Ruler, Sparkles } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '../../lib/api'
import { formatCompactPrice, readablePropertyType } from '../../lib/format'
import { crmService } from '../../services/crm.service'
import { useAuthStore } from '../../store/auth-store'
import type { Property } from '../../types/property'

interface PropertyCardProps {
  property: Property
  compact?: boolean
  score?: number
}

export function PropertyCard({ property, compact = false, score }: PropertyCardProps) {
  const cover = property.images.find((image) => image.isCover) ?? property.images[0]
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const favorites = useQuery({
    queryKey: ['favorites', 'check', property.id],
    queryFn: () => crmService.checkFavorite(property.id),
    enabled: Boolean(user),
    retry: false,
  })
  const isFavorite = favorites.data ?? false

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (isFavorite) await crmService.removeFavorite(property.id)
      else await crmService.addFavorite(property.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(isFavorite ? 'Removed from saved homes.' : 'Saved to your favorites.')
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not update favorites.')
    },
  })

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
          {score !== undefined && <span className="match-badge"><Sparkles size={12} />{Math.round(score * 100)}% match</span>}
        </div>
      </Link>
      <div className="property-card-content">
        <div className="property-card-topline">
          <span className="property-category">{readablePropertyType(property.propertyType)}</span>
          <button
            type="button"
            className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
            aria-label={isFavorite ? `Remove ${property.title} from favorites` : `Save ${property.title}`}
            aria-pressed={isFavorite}
            title={isFavorite ? 'Remove from saved homes' : 'Save this home'}
            onClick={() => {
              if (!user) {
                toast.info('Sign in to save homes.')
                navigate('/login', { state: { from: location.pathname + location.search } })
                return
              }
              if (favorites.isError) {
                toast.error(favorites.error instanceof ApiError
                  ? favorites.error.message
                  : 'Could not load your saved homes. Please try again.')
                return
              }
              toggleFavorite.mutate()
            }}
            disabled={toggleFavorite.isPending || favorites.isLoading}
          >
            <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
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
