import WeatherDayList from './WeatherDayList'

function HistoricalWeather({
  historicalWeather,
  attribution,
}) {
  if (!historicalWeather) {
    return null
  }

  return (
    <section className="historical-weather">
      <h2 className="historical-weather__title">
        Weather From the Same Dates Last Year
      </h2>

      <p className="historical-weather__period">
        Historical period:{' '}
        {historicalWeather.historicalStartDate}
        {' – '}
        {historicalWeather.historicalEndDate}
      </p>

      <p className="historical-weather__notice">
        Historical weather is provided for reference only.
        It is not a forecast, and actual conditions may
        differ.
      </p>

      <p className="historical-weather__timezone">
        Timezone: {historicalWeather.timezone}
      </p>

      <WeatherDayList
        days={historicalWeather.days}
        units={historicalWeather.units}
      />

      <p className="historical-weather__attribution">
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

export default HistoricalWeather