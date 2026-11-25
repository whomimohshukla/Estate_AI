export function PropertyCardSkeleton() {
  return (
    <div className="property-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line title" />
        <div className="skeleton skeleton-line medium" />
        <div className="skeleton skeleton-line wide" />
        <div className="skeleton skeleton-line price" />
      </div>
    </div>
  )
}
