import { Link } from 'react-router-dom'
import '../../css/components/next-trip-card.css'

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

function getDateOnlyValue(dateValue) {
  if (!dateValue) {
    return null
  }

  const [year, month, day] = dateValue
    .slice(0, 10)
    .split('-')
    .map(Number)

  return new Date(
    year,
    month - 1,
    day,
  )
}

function formatTripDate(dateValue) {
  const date =
    getDateOnlyValue(dateValue)

  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getTripDestination(trip) {
  return [
    trip.destinationCity,
    trip.destinationCountryName,
  ]
    .filter(Boolean)
    .join(', ')
}

function NextTripCard({
  trip,
  flagUrl,
}) {
  if (!trip) {
    return null
  }

  const destination =
    getTripDestination(trip)

  const tripName =
    trip.title ||
    destination ||
    'Upcoming trip'

  return (
    <Link
      className="next-trip-card"
      to={`/trips/${trip.id}`}
      aria-label={`View next trip: ${tripName}`}
    >
      <div
        className={`next-trip-card__icon${
          flagUrl
            ? ' next-trip-card__icon--flag'
            : ''
        }`}
      >
        {flagUrl ? (
          <img
            className="next-trip-card__flag"
            src={flagUrl}
            alt={`Flag of ${trip.destinationCountryName}`}
            loading="lazy"
          />
        ) : (
          <LocationIcon />
        )}
      </div>

      <div className="next-trip-card__copy">
        <p className="next-trip-card__eyebrow">
          NEXT TRIP
        </p>

        <h2 className="next-trip-card__title">
          {tripName}
        </h2>

        {destination && (
          <p className="next-trip-card__destination">
            {destination}
          </p>
        )}
      </div>

      <div className="next-trip-card__date">
        <span>
          {formatTripDate(trip.startDate)}
        </span>

        {trip.endDate && (
          <>
            <span
              className="next-trip-card__date-divider"
              aria-hidden="true"
            >
              →
            </span>

            <span>
              {formatTripDate(trip.endDate)}
            </span>
          </>
        )}
      </div>

      <div className="next-trip-card__action">
        <span>View trip</span>

        <span
          className="next-trip-card__arrow"
          aria-hidden="true"
        >
          <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

export default NextTripCard