import WeatherDayList from './WeatherDayList'
import '../../css/components/weather-forecast.css'

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

function WeatherForecast({
  forecast,
  isPartial,
  forecastDays,
  attribution,
}) {
  if (!forecast) {
    return null
  }

  return (
    <section
      className="weather-forecast"
      aria-labelledby="weather-forecast-title"
    >
      <div className="weather-forecast__header">
        <div>
          <p className="weather-forecast__eyebrow">
            WEATHER
          </p>

          <h2
            id="weather-forecast-title"
            className="weather-forecast__title"
          >
            Weather forecast
          </h2>

          <p className="weather-forecast__description">
            Weather information for your selected
            travel dates.
          </p>
        </div>

        {forecast.timezone && (
          <div className="weather-forecast__timezone">
            <span className="weather-forecast__timezone-label">
              Local timezone
            </span>

            <span className="weather-forecast__timezone-value">
              {forecast.timezone}
            </span>
          </div>
        )}
      </div>

      {isPartial && (
        <div className="weather-forecast__notice">
          <span
            className="weather-forecast__notice-icon"
            aria-hidden="true"
          >
            <InfoIcon />
          </span>

          <p>
            Only the dates currently inside the{' '}
            {forecastDays}-day forecast range are
            available.
          </p>
        </div>
      )}

      <WeatherDayList
        days={forecast.days}
        units={forecast.units}
        showPrecipitationProbability
      />

      <div className="weather-forecast__footer">
        <span>Weather data provided by</span>

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

export default WeatherForecast