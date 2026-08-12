import '../../css/components/forecast-unavailable.css'

function WeatherIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="8"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M5.5 16.5h11a3.5 3.5 0 0 0 .4-7 4.8 4.8 0 0 0-8.9 1.9 2.8 2.8 0 0 0-2.5 5.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 9V4m0 0h5M4 4l3.2 3.2A8 8 0 1 1 4.7 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 8v4l2.7 1.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ForecastUnavailable({
  isUnavailable,
  forecastDays,
  isLoadingHistoricalWeather,
  historicalWeatherError,
  onViewLastYearWeather,
}) {
  if (!isUnavailable) {
    return null
  }

  return (
    <section
      className="forecast-unavailable"
      aria-labelledby="forecast-unavailable-title"
    >
      <div className="forecast-unavailable__icon">
        <WeatherIcon />
      </div>

      <div className="forecast-unavailable__content">
        <p className="forecast-unavailable__eyebrow">
          WEATHER
        </p>

        <h2
          id="forecast-unavailable-title"
          className="forecast-unavailable__title"
        >
          Forecast not available yet
        </h2>

        <p className="forecast-unavailable__message">
          Your travel dates are currently outside the
          available weather forecast range.
        </p>

        <p className="forecast-unavailable__availability">
          Forecast information becomes available within{' '}
          <strong>{forecastDays} days</strong> of the
          trip.
        </p>

        <div className="forecast-unavailable__historical">
          <div>
            <h3 className="forecast-unavailable__historical-title">
              Want a point of reference?
            </h3>

            <p className="forecast-unavailable__historical-description">
              View weather data from the same dates last
              year to get a general idea of typical
              conditions.
            </p>
          </div>

          <button
            className="forecast-unavailable__button"
            type="button"
            onClick={onViewLastYearWeather}
            disabled={isLoadingHistoricalWeather}
          >
            <span
              className="forecast-unavailable__button-icon"
              aria-hidden="true"
            >
              <HistoryIcon />
            </span>

            <span>
              {isLoadingHistoricalWeather
                ? 'Loading weather...'
                : "View last year's weather"}
            </span>
          </button>
        </div>

        {historicalWeatherError && (
          <p
            className="forecast-unavailable__error"
            role="alert"
          >
            {historicalWeatherError}
          </p>
        )}
      </div>
    </section>
  )
}

export default ForecastUnavailable