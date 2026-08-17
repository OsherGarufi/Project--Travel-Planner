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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 3v4M16 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M15 10h6v4h-6a2 2 0 1 1 0-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
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
  const date = getDateOnlyValue(dateValue)

  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatBudget(amount) {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return amount
  }

  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

function TripCard({
  trip,
  status,
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

  const tripName =
    trip.title ||
    destination ||
    'Saved trip'

  const statusLabel =
    status === 'current'
      ? 'Current'
      : status === 'upcoming'
        ? 'Upcoming'
        : 'Past'

  return (
    <article className="trip-card">
      <div className="trip-card__top">
        <div className="trip-card__country">
          {flagUrl ? (
            <div className="trip-card__flag-wrapper">
              <img
                className="trip-card__flag"
                src={flagUrl}
                alt={`Flag of ${trip.destinationCountryName}`}
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="trip-card__flag-fallback"
              aria-hidden="true"
            >
              {trip.destinationCountryCode ||
                'TR'}
            </div>
          )}

          <div className="trip-card__country-copy">
            <span className="trip-card__country-name">
              {trip.destinationCountryName ||
                'Destination'}
            </span>

            {trip.destinationCountryCode && (
              <span className="trip-card__country-code">
                {trip.destinationCountryCode}
              </span>
            )}
          </div>
        </div>

        <span
          className={`trip-card__status trip-card__status--${status}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="trip-card__content">
        <h3 className="trip-card__title">
          {tripName}
        </h3>

        {destination && (
          <p className="trip-card__destination">
            {destination}
          </p>
        )}

        <div className="trip-card__details">
          {(startDate || endDate) && (
            <div className="trip-card__detail">
              <span
                className="trip-card__detail-icon"
                aria-hidden="true"
              >
                <CalendarIcon />
              </span>

              <span>
                {startDate}
                {startDate && endDate && ' — '}
                {endDate}
              </span>
            </div>
          )}

          {trip.budgetAmount !== null &&
            trip.budgetAmount !== undefined && (
              <div className="trip-card__detail">
                <span
                  className="trip-card__detail-icon"
                  aria-hidden="true"
                >
                  <WalletIcon />
                </span>

                <span>
                  {formatBudget(
                    trip.budgetAmount,
                  )}{' '}
                  {trip.budgetCurrency}
                </span>
              </div>
            )}
        </div>
      </div>

      <Link
        className="trip-card__link"
        to={`/trips/${trip.id}`}
        aria-label={`View ${tripName}`}
      >
        <span>View trip</span>

        <span
          className="trip-card__link-icon"
          aria-hidden="true"
        >
          <ArrowIcon />
        </span>
      </Link>
    </article>
  )
}

export default TripCard