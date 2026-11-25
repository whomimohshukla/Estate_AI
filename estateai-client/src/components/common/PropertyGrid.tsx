import type { Property } from '../../types/property'
import { PropertyCard } from './PropertyCard'

export function PropertyGrid({ properties }: { properties: Property[] }) {
  return (
    <div className="property-grid">
      {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
    </div>
  )
}
