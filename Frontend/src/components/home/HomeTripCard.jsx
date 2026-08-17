import { Link } from 'react-router-dom'
import '../../css/components/trip-card.css'

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

function formatTripDate(dateValue) {
  if (!dateValue) {
    return ''
  }

  const [year, month, day] = dateValue
    .slice(0, 10)
    .split('-')
    .map(Number)

  const date = new Date(
    year,
    month - 1,
    day,
  )

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function HomeTripCard({
  trip,
  flagUrl,
}) {
  const destination = [
    trip.destinationCity,
    trip.destinationCountryName,
  ]
    .filter(Boolean)
    .join(', ')

  const startDate =
    formatTripDate(trip.startDate)

  const endDate =
    formatTripDate(trip.endDate)

  return (
    <article className="home-page__trip-card">
      <div className="home-page__trip-card-top">
        <div className="trip-card__country">
          {flagUrl && (
            <div className="trip-card__flag-wrapper">
              <img
                className="trip-card__flag"
                src={flagUrl}
                alt={`Flag of ${trip.destinationCountryName}`}
                loading="lazy"
              />
            </div>
          )}

          <span className="trip-card__country-name">
            {trip.destinationCountryName ||
              'Destination'}
          </span>
        </div>
      </div>

      <div className="home-page__trip-card-content">
        <h3 className="home-page__trip-title">
          {trip.title ||
            destination ||
            'Saved trip'}
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
        aria-label={`View ${
          trip.title ||
          destination ||
          'trip'
        }`}
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