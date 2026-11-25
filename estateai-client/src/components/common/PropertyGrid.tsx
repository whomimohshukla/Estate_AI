import type { Property } from '../../types/property'
import { PropertyCard } from './PropertyCard'

export function PropertyGrid({ properties, scores }: { properties: Property[]; scores?: Record<string, number> }) {
  return (
    <div className="property-grid">
      {properties.map((property) => <PropertyCard key={property.id} property={property} score={scores?.[property.id]} />)}
    </div>
  )
}
