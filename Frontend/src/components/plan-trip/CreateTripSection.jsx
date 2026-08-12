import '../../css/components/create-trip-section.css'

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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="1.9"
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

function CreateTripSection({
  countryName,
  cityName,
  startDate,
  endDate,
  isCreatingTrip,
  isCreateDisabled,
  createTripError,
  onCreateTrip,
}) {
  const hasTripSummary =
    countryName &&
    cityName &&
    startDate &&
    endDate

  return (
    <section
      className={`create-trip-section${
        hasTripSummary
          ? ' create-trip-section--ready'
          : ''
      }`}
      aria-labelledby="create-trip-title"
    >
      <div className="create-trip-section__header">
        <div>
          <p className="create-trip-section__eyebrow">
            FINAL STEP
          </p>

          <h2
            id="create-trip-title"
            className="create-trip-section__title"
          >
            Create your trip
          </h2>

          <p className="create-trip-section__description">
            Review your destination and travel dates
            before saving the trip.
          </p>
        </div>

        {hasTripSummary && (
          <span className="create-trip-section__ready-badge">
            <span
              className="create-trip-section__ready-icon"
              aria-hidden="true"
            >
              <CheckIcon />
            </span>

            Ready to create
          </span>
        )}
      </div>

      {hasTripSummary ? (
        <div className="create-trip-section__summary">
          <div className="create-trip-section__summary-item">
            <span
              className="create-trip-section__summary-icon"
              aria-hidden="true"
            >
              <LocationIcon />
            </span>

            <div>
              <p className="create-trip-section__summary-label">
                Destination
              </p>

              <p className="create-trip-section__summary-value">
                {cityName}, {countryName}
              </p>
            </div>
          </div>

          <div className="create-trip-section__summary-item">
            <span
              className="create-trip-section__summary-icon"
              aria-hidden="true"
            >
              <CalendarIcon />
            </span>

            <div>
              <p className="create-trip-section__summary-label">
                Travel dates
              </p>

              <p className="create-trip-section__summary-value">
                {formatTripDate(startDate)}
                {' — '}
                {formatTripDate(endDate)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="create-trip-section__pending">
          <span
            className="create-trip-section__pending-icon"
            aria-hidden="true"
          >
            <LocationIcon />
          </span>

          <div>
            <p className="create-trip-section__pending-title">
              Trip details are not complete yet
            </p>

            <p className="create-trip-section__pending-description">
              Choose a country, city and travel dates to
              unlock trip creation.
            </p>
          </div>
        </div>
      )}

      <div className="create-trip-section__footer">
        <p className="create-trip-section__footer-note">
          Your trip will be saved to My Trips and can
          be viewed again at any time.
        </p>

        <button
          className="create-trip-section__button"
          type="button"
          onClick={onCreateTrip}
          disabled={isCreateDisabled}
        >
          {isCreatingTrip ? (
            'Creating trip...'
          ) : (
            <>
              <span
                className="create-trip-section__button-icon"
                aria-hidden="true"
              >
                <CheckIcon />
              </span>

              <span>Create trip</span>
            </>
          )}
        </button>
      </div>

      {createTripError && (
        <p
          className="create-trip-section__error"
          role="alert"
        >
          {createTripError}
        </p>
      )}
    </section>
  )
}

export default CreateTripSection