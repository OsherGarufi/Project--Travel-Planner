import WeatherDayList from './WeatherDayList'
import '../../css/components/historical-weather.css'

function InfoIcon() {
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
        d="M12 10.5V16M12 7.5h.01"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  )
}

function formatHistoricalDate(dateValue) {
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

function HistoricalWeather({
  historicalWeather,
  attribution,
}) {
  if (!historicalWeather) {
    return null
  }

  return (
    <section
      className="historical-weather"
      aria-labelledby="historical-weather-title"
    >
      <div className="historical-weather__header">
        <div>
          <p className="historical-weather__eyebrow">
            HISTORICAL WEATHER
          </p>

          <h2
            id="historical-weather-title"
            className="historical-weather__title"
          >
            Same dates last year
          </h2>

          <p className="historical-weather__period">
            {formatHistoricalDate(
              historicalWeather.historicalStartDate,
            )}
            {' — '}
            {formatHistoricalDate(
              historicalWeather.historicalEndDate,
            )}
          </p>
        </div>

        {historicalWeather.timezone && (
          <div className="historical-weather__timezone">
            <span className="historical-weather__timezone-label">
              Local timezone
            </span>

            <span className="historical-weather__timezone-value">
              {historicalWeather.timezone}
            </span>
          </div>
        )}
      </div>

      <div className="historical-weather__notice">
        <span
          className="historical-weather__notice-icon"
          aria-hidden="true"
        >
          <InfoIcon />
        </span>

        <p>
          Historical weather is provided for reference
          only. It is not a forecast and actual
          conditions may differ.
        </p>
      </div>

      <WeatherDayList
        days={historicalWeather.days}
        units={historicalWeather.units}
      />

      <div className="historical-weather__footer">
        <span>Historical data provided by</span>

        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          {attribution}
        </a>
      </div>
    </section>
  )
}

export default HistoricalWeather