import '../../css/components/trip-summary.css'

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
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="10"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
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

function NotesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 8h8M8 12h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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

function getToday() {
  const today = new Date()

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
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

function getTripStatus(
  startDateValue,
  endDateValue,
) {
  const today = getToday()

  const startDate =
    getDateOnlyValue(startDateValue)

  const endDate =
    getDateOnlyValue(endDateValue)

  if (
    startDate &&
    endDate &&
    startDate <= today &&
    endDate >= today
  ) {
    return {
      key: 'current',
      label: 'Current trip',
    }
  }

  if (startDate && startDate > today) {
    return {
      key: 'upcoming',
      label: 'Upcoming',
    }
  }

  return {
    key: 'past',
    label: 'Past trip',
  }
}

function TripSummary({
  trip,
  flagUrl,
}) {
  const status = getTripStatus(
    trip.startDate,
    trip.endDate,
  )

  const startDate =
    formatTripDate(trip.startDate)

  const endDate =
    formatTripDate(trip.endDate)

  const destination = [
    trip.destinationCity,
    trip.destinationCountryName,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="trip-summary">
      <section
        className="trip-summary__overview"
        aria-labelledby="trip-summary-title"
      >
        <div className="trip-summary__header">
          <div className="trip-summary__destination-header">
            {flagUrl ? (
              <div className="trip-summary__flag-wrapper">
                <img
                  className="trip-summary__flag"
                  src={flagUrl}
                  alt={`Flag of ${trip.destinationCountryName}`}
                />
              </div>
            ) : (
              <div
                className="trip-summary__flag-fallback"
                aria-hidden="true"
              >
                {trip.destinationCountryCode ||
                  'TR'}
              </div>
            )}

            <div>
              <p className="trip-summary__eyebrow">
                TRIP DETAILS
              </p>

              <p className="trip-summary__country">
                {trip.destinationCountryName}
              </p>
            </div>
          </div>

          <span
            className={`trip-summary__status trip-summary__status--${status.key}`}
          >
            {status.label}
          </span>
        </div>

        <div className="trip-summary__hero">
          <h1
            id="trip-summary-title"
            className="trip-summary__title"
          >
            {trip.title}
          </h1>

          <p className="trip-summary__destination">
            {destination}
          </p>
        </div>

        <div className="trip-summary__details">
          <div className="trip-summary__detail-card">
            <span
              className="trip-summary__detail-icon"
              aria-hidden="true"
            >
              <LocationIcon />
            </span>

            <div>
              <p className="trip-summary__detail-label">
                Destination
              </p>

              <p className="trip-summary__detail-value">
                {destination}
              </p>
            </div>
          </div>

          <div className="trip-summary__detail-card">
            <span
              className="trip-summary__detail-icon"
              aria-hidden="true"
            >
              <CalendarIcon />
            </span>

            <div>
              <p className="trip-summary__detail-label">
                Travel dates
              </p>

              <p className="trip-summary__detail-value">
                {startDate} — {endDate}
              </p>
            </div>
          </div>

          <div className="trip-summary__detail-card">
            <span
              className="trip-summary__detail-icon"
              aria-hidden="true"
            >
              <WalletIcon />
            </span>

            <div>
              <p className="trip-summary__detail-label">
                Planned budget
              </p>

              <p className="trip-summary__detail-value">
                {trip.budgetAmount !== null &&
                trip.budgetAmount !== undefined
                  ? `${formatBudget(
                      trip.budgetAmount,
                    )} ${
                      trip.budgetCurrency
                    }`
                  : 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="trip-summary__notes"
        aria-labelledby="trip-notes-title"
      >
        <div className="trip-summary__notes-header">
          <span
            className="trip-summary__notes-icon"
            aria-hidden="true"
          >
            <NotesIcon />
          </span>

          <div>
            <p className="trip-summary__notes-eyebrow">
              PERSONAL NOTES
            </p>

            <h2
              id="trip-notes-title"
              className="trip-summary__notes-title"
            >
              Trip notes
            </h2>
          </div>
        </div>

        {trip.notes ? (
          <p className="trip-summary__notes-text">
            {trip.notes}
          </p>
        ) : (
          <p className="trip-summary__notes-empty">
            No notes have been added to this trip yet.
          </p>
        )}
      </section>
    </div>
  )
}

export default TripSummary