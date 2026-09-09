import { useEffect, useId, useRef, useState } from 'react'
import { safeAttractionUrl } from '../../services/attractions/attractionsService'

function distanceFromUser(position, latitude, longitude) {
  const radians = (degrees) => degrees * Math.PI / 180
  const deltaLat = radians(latitude - position.latitude)
  const deltaLon = radians(longitude - position.longitude)
  const a = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(position.latitude)) * Math.cos(radians(latitude)) * Math.sin(deltaLon / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)))
}

function formatDistance(metres) {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`
}

export default function AttractionCard({ attraction, onAdd, userPosition }) {
  const [failedImage, setFailedImage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const menu = useRef(null)
  const menuId = useId()
  const imageUrl = safeAttractionUrl(attraction.imageUrl)
  const website = safeAttractionUrl(attraction.website)
  const hasCoordinates = Number.isFinite(attraction.latitude) && Number.isFinite(attraction.longitude)
  const distance = hasCoordinates && userPosition
    ? `${formatDistance(distanceFromUser(userPosition, attraction.latitude, attraction.longitude))} from you`
    : Number.isFinite(attraction.providerDistance)
      ? `${formatDistance(attraction.providerDistance)} from search center` : ''

  useEffect(() => {
    if (!menuOpen) return undefined
    menu.current?.querySelector('a')?.focus()
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setMenuOpen(false)
    }
    const escape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [menuOpen])

  const destination = `${attraction.latitude},${attraction.longitude}`
  const google = 'https://www.google.com/maps/dir/?' + new URLSearchParams({
    api: '1', destination,
  })
  const waze = 'https://waze.com/ul?' + new URLSearchParams({ ll: destination, navigate: 'yes' })

  return (
    <article className="attraction-card">
      <div className="attraction-card__media">
        {imageUrl && failedImage !== imageUrl ? (
          <img src={imageUrl} alt={attraction.name} loading="lazy" referrerPolicy="no-referrer"
            onError={() => setFailedImage(imageUrl)} />
        ) : (
          <div className="attraction-card__fallback" data-category={attraction.category}>
            <svg viewBox="0 0 80 60" fill="none" aria-hidden="true">
              <path d="M8 49 28 20l15 19 10-14 19 24H8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="57" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>{attraction.category || 'Explore'}</span>
          </div>
        )}
        {attraction.category && <span className="attraction-card__category">{attraction.category}</span>}
      </div>
      <div className="attraction-card__body">
        <h3>{attraction.name}</h3>
        {distance && <p className="attraction-card__distance">{distance}</p>}
        {attraction.address && <p className="attraction-card__address">{attraction.address}</p>}
        <div className="attraction-card__description">
          {attraction.description && <p>{attraction.description}</p>}
          {attraction.detailsLoading && <span className="attraction-card__enriching">Adding place details…</span>}
          {attraction.detailsError && <span className="attraction-card__enriching">Extra details unavailable.</span>}
        </div>
        {website && <a className="attraction-card__website" href={website} target="_blank" rel="noopener noreferrer">Visit website ↗</a>}
        <div className="attraction-card__actions">
          <div className="attraction-card__navigate" ref={root} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false)
          }}>
            <button type="button" className="attractions-button" ref={trigger}
              disabled={!hasCoordinates} aria-haspopup="menu" aria-expanded={menuOpen}
              aria-controls={menuOpen ? menuId : undefined}
              onClick={() => setMenuOpen((value) => !value)}>
              Navigate <span aria-hidden="true">⌄</span>
            </button>
            {menuOpen && <div className="attraction-card__menu" id={menuId} ref={menu} role="menu"
              aria-label={`Navigate to ${attraction.name}`}
              onKeyDown={(event) => {
                const links = [...menu.current.querySelectorAll('a')]

                if (!links.length) {
                  return
                }

                const index = links.indexOf(document.activeElement)

                let nextIndex

                switch (event.key) {
                  case 'ArrowDown':
                    nextIndex = index === -1
                      ? 0
                      : (index + 1) % links.length
                    break

                  case 'ArrowUp':
                    nextIndex = index === -1
                      ? links.length - 1
                      : (index - 1 + links.length) % links.length
                    break

                  case 'Home':
                    nextIndex = 0
                    break

                  case 'End':
                    nextIndex = links.length - 1
                    break

                  default:
                    return
                }

                event.preventDefault()
                links[nextIndex]?.focus()
              }}>
              {[['Waze', waze], ['Google Maps', google]].map(([label, href]) => (
                <a key={label} role="menuitem" href={href} target="_blank" rel="noopener noreferrer"
                  onClick={() => { setMenuOpen(false); trigger.current?.focus() }}>{label} ↗</a>
              ))}
            </div>}
          </div>
          <button type="button" className="attractions-button attractions-button--primary"
            onClick={() => onAdd(attraction)}>Add to itinerary</button>
        </div>
      </div>
    </article>
  )
}
