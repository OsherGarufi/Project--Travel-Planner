import { Link } from 'react-router-dom'

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 12h14M14 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="10"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function formatTripDate(dateValue) {
  if (!dateValue) {
    return ''
  }

  const [year, month, day] = dateValue
    .slice(0, 10)
    .split('-')
    .map(Number)

  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function HomeTripCard({ trip }) {
  const destination = [
    trip.destinationCity,
    trip.destinationCountryName,
  ]
    .filter(Boolean)
    .join(', ')

  const startDate = formatTripDate(trip.startDate)
  const endDate = formatTripDate(trip.endDate)

  return (
    <article className="home-page__trip-card">
      <div className="home-page__trip-card-top">
        <span
          className="home-page__trip-icon"
          aria-hidden="true"
        >
          <LocationIcon />
        </span>

        <span className="home-page__trip-country-code">
          {trip.destinationCountryCode || 'TRIP'}
        </span>
      </div>

      <div className="home-page__trip-card-content">
        <h3 className="home-page__trip-title">
          {trip.title || destination || 'Saved trip'}
        </h3>

        {destination && (
          <p className="home-page__trip-destination">
            {destination}
          </p>
        )}

        {(startDate || endDate) && (
          <p className="home-page__trip-dates">
            {startDate}
            {startDate && endDate && ' — '}
            {endDate}
          </p>
        )}
      </div>

      <Link
        className="home-page__trip-link"
        to={`/trips/${trip.id}`}
        aria-label={`View ${trip.title || destination || 'trip'}`}
      >
        <span>View trip</span>

        <span
          className="home-page__trip-link-icon"
          aria-hidden="true"
        >
          <ArrowIcon />
        </span>
      </Link>
    </article>
  )
}

export default HomeTripCard