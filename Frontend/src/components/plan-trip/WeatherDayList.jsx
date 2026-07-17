function WeatherDayList({
  days,
  units,
  showPrecipitationProbability = false,
}) {
  if (!Array.isArray(days) || days.length === 0) {
    return null
  }

  return (
    <ul className="weather-day-list">
      {days.map((day) => (
        <li
          key={day.date}
          className="weather-day-list__item"
        >
          <h3>{day.date}</h3>

          <p>
            Temperature:{' '}
            {day.minimumTemperature}
            {units.temperature}
            {' – '}
            {day.maximumTemperature}
            {units.temperature}
          </p>

          <p>
            Feels like:{' '}
            {day.minimumApparentTemperature}
            {units.temperature}
            {' – '}
            {day.maximumApparentTemperature}
            {units.temperature}
          </p>

          {showPrecipitationProbability && (
            <p>
              Precipitation probability:{' '}
              {day.precipitationProbability}
              {units.precipitationProbability}
            </p>
          )}

          <p>
            Precipitation amount:{' '}
            {day.precipitationSum}
            {units.precipitation}
          </p>

          <p>
            Maximum wind speed:{' '}
            {day.maximumWindSpeed}{' '}
            {units.windSpeed}
          </p>

          <p>Sunrise: {day.sunrise}</p>

          <p>Sunset: {day.sunset}</p>
        </li>
      ))}
    </ul>
  )
}

export default WeatherDayList