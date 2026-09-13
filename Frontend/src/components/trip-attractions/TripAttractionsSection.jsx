import { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTripAttractions } from '../../hooks/trip-attractions/useTripAttractions'
import AttractionCard from './AttractionCard'
import AttractionsFilters from './AttractionsFilters'
import '../../css/components/trip-attractions-section.css'

function AttractionsContent({ trip, userId, onAddToItinerary }) {
  const attractions = useTripAttractions(trip, userId)
  const [visible, setVisible] = useState(true)
  const contentId = useId()
  const [userPosition, setUserPosition] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  const searching = ['resolving', 'loading'].includes(attractions.status)
  const enriching = attractions.items.filter((item) => item.detailsLoading).length

  const locate = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is unavailable. Distances use the search center.')
      return
    }
    setLocating(true)
    setLocationMessage('')
    navigator.geolocation.getCurrentPosition((position) => {
      if (!mounted.current) return
      setUserPosition({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      setLocating(false)
      setLocationMessage('Distances now show how far attractions are from you.')
    }, () => {
      if (!mounted.current) return
      setLocating(false)
      setLocationMessage('Location was unavailable or not allowed. Distances use the search center.')
    }, { timeout: 10000, maximumAge: 60000 })
  }

  return (
    <section className="trip-attractions" aria-label="Explore attractions">
      <header className="trip-attractions__header">
        <div>
          <p className="trip-attractions__eyebrow">MAKE ROOM FOR DISCOVERY</p>
          <h2>Explore attractions</h2>
          <p>Find your next stop around {trip.destinationCity}, {trip.destinationCountryName}.</p>
        </div>
        <button type="button" className="attractions-button" aria-expanded={visible}
          aria-controls={contentId} onClick={() => setVisible((value) => !value)}>
          {visible ? 'Hide attractions' : `View attractions (${attractions.loadedCount})`}
        </button>
      </header>
      <div id={contentId} hidden={!visible}>
      <AttractionsFilters filters={attractions.filters} onChange={attractions.setFilters}
        onSearch={attractions.search} searching={searching}
        userId={userId} perPage={attractions.perPage} onPerPageChange={attractions.changePerPage}
        disabled={!attractions.configured || !userId || !trip.destinationCity || !trip.destinationCountryCode} />
      {(!trip.destinationCity || !trip.destinationCountryCode) && <p className="trip-attractions__error">
        This trip needs a destination city and country to explore attractions.
      </p>}
      {!attractions.configured && <p className="trip-attractions__error" role="alert">
        Attractions is not configured. Set VITE_GEOAPIFY_API_KEY to enable search.
      </p>}
      {attractions.status === 'idle' && <p className="trip-attractions__state">
        Choose a category and radius, then search. You can add any discovery to Plan Later.
      </p>}
      {searching && <div className="trip-attractions__state" role="status">
        <span className="trip-attractions__spinner" aria-hidden="true" />
        {attractions.status === 'resolving' ? 'Locating your destination.' : 'Finding attractions.'}
      </div>}
      {attractions.error && <p className="trip-attractions__error" role="alert">{attractions.error}</p>}
      {attractions.status === 'ready' && <div className="trip-attractions__results-bar">
        <p role="status">{attractions.items.length} shown / {attractions.loadedCount} loaded
          {attractions.searchedFilters && ` · ${attractions.searchedFilters.label} · within ${attractions.searchedFilters.radius / 1000} km of the destination`}
          {enriching > 0 && ` · Adding details to ${enriching}`}
        </p>
        {attractions.items.length > 0 && !userPosition && <button type="button"
          className="trip-attractions__location" onClick={locate} disabled={locating}>
          {locating ? 'Locating.' : 'Use my location for distances'}
        </button>}
      </div>}
      {locationMessage && <p className="trip-attractions__note" role="status">{locationMessage}</p>}
      {attractions.status === 'ready' && !attractions.items.length && <p className="trip-attractions__state">
        No named attractions found here. Try another category or a wider radius.
      </p>}
      <div className="trip-attractions__grid">
        {attractions.items.map((item) => <AttractionCard key={item.placeId}
          attraction={item} userPosition={userPosition} onAdd={onAddToItinerary} />)}
      </div>
      {attractions.moreError && <p className="trip-attractions__error" role="alert">{attractions.moreError}</p>}
      {attractions.canLoadMore && <div className="trip-attractions__more">
        <button type="button" className="attractions-button" onClick={attractions.loadMore}
          disabled={attractions.busy || searching}>
          {attractions.busy ? 'Loading...' : 'Load 3 more'}
        </button>
      </div>}
      {attractions.status === 'ready' && <nav className="trip-attractions__pagination" aria-label="Attractions pages">
        <button type="button" className="attractions-button"
          disabled={attractions.currentPage === 1 || attractions.busy}
          onClick={() => attractions.changePage(attractions.currentPage - 1)}>Previous</button>
        <span>Page {attractions.currentPage}</span>
        <button type="button" className="attractions-button"
          disabled={!attractions.canNext || attractions.busy}
          onClick={() => attractions.changePage(attractions.currentPage + 1)}>Next</button>
      </nav>}
      <footer className="trip-attractions__credits">
        Places by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a>
        {' · '}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
      </footer>
      </div>
    </section>
  )
}

export default function TripAttractionsSection(props) {
  const { firebaseUser } = useAuth()
  // Remount on destination/account changes: no previous user's cards or requests survive.
  const key = JSON.stringify([firebaseUser?.uid, props.trip.id,
    props.trip.destinationCountryCode, props.trip.destinationCity])
  return <AttractionsContent key={key} {...props} userId={firebaseUser?.uid} />
}