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
    <section className="forecast-unavailable">
      <h2 className="forecast-unavailable__title">
        Weather Forecast
      </h2>

      <p className="forecast-unavailable__message">
        A weather forecast is not available for these dates
        yet.
      </p>

      <p className="forecast-unavailable__availability">
        Forecast information becomes available within{' '}
        {forecastDays} days of the trip.
      </p>

      <p className="forecast-unavailable__historical-prompt">
        Would you like to view the weather from the same
        dates last year?
      </p>

      <button
        type="button"
        onClick={onViewLastYearWeather}
        disabled={isLoadingHistoricalWeather}
      >
        {isLoadingHistoricalWeather
          ? 'Loading Last Year’s Weather...'
          : 'View Last Year’s Weather'}
      </button>

      {historicalWeatherError && (
        <p className="forecast-unavailable__error">
          {historicalWeatherError}
        </p>
      )}
    </section>
  )
}

export default ForecastUnavailable