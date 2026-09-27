import '../../css/components/daily-travel-tip-card.css'

function CompassIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DailyTravelTipCard({
  tip,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <section
        className="daily-travel-tip-card daily-travel-tip-card--loading"
        aria-label="Loading Trip Daily"
        aria-busy="true"
      >
        <div
          className="daily-travel-tip-card__icon"
          aria-hidden="true"
        >
          <CompassIcon />
        </div>

        <div
          className="daily-travel-tip-card__skeleton"
          aria-hidden="true"
        >
          <span className="daily-travel-tip-card__skeleton-line daily-travel-tip-card__skeleton-line--label" />
          <span className="daily-travel-tip-card__skeleton-line daily-travel-tip-card__skeleton-line--title" />
          <span className="daily-travel-tip-card__skeleton-line" />
        </div>
      </section>
    )
  }

  if (!tip) {
    return null
  }

  return (
    <section
      className="daily-travel-tip-card"
      aria-labelledby="daily-travel-tip-title"
    >
      <div
        className="daily-travel-tip-card__icon"
        aria-hidden="true"
      >
        <CompassIcon />
      </div>

      <div className="daily-travel-tip-card__copy">
        <p className="daily-travel-tip-card__eyebrow">
          TRIP DAILY
        </p>

        <h2
          id="daily-travel-tip-title"
          className="daily-travel-tip-card__title"
        >
          {tip.title}
        </h2>

        <p className="daily-travel-tip-card__tip">
          {tip.tip}
        </p>
      </div>
    </section>
  )
}

export default DailyTravelTipCard
