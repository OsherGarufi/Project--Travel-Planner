import WeatherDayList from './WeatherDayList'

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
    <section className="weather-forecast">
      <h2 className="weather-forecast__title">
        Weather Forecast
      </h2>

      {isPartial && (
        <p className="weather-forecast__notice">
          Only the days currently inside the{' '}
          {forecastDays}-day forecast range are
          displayed.
        </p>
      )}

      <p className="weather-forecast__timezone">
        Timezone: {forecast.timezone}
      </p>

      <WeatherDayList
        days={forecast.days}
        units={forecast.units}
        showPrecipitationProbability
      />

      <p className="weather-forecast__attribution">
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          {attribution}
        </a>
      </p>
    </section>
  )
}

export default WeatherForecast