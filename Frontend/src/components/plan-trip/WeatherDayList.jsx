import '../../css/components/weather-day-list.css'

function TemperatureIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 14.7V5a2 2 0 1 1 4 0v9.7a4 4 0 1 1-4 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 8v8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RainIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7.5 17.5h9a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.4 1.7A3.2 3.2 0 0 0 7.5 17.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m9 20-.8 1.5M13 20l-.8 1.5M17 20l-.8 1.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WindIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 8h10.5a2.5 2.5 0 1 0-2.2-3.7M4 12h14a2.5 2.5 0 1 1-2.2 3.7M4 16h7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SunIcon() {
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
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
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

  return new Date(year, month - 1, day)
}

function formatWeatherDate(dateValue) {
  const date = getDateOnlyValue(dateValue)

  if (!date) {
    return {
      weekday: '',
      date: dateValue,
    }
  }

  return {
    weekday: new Intl.DateTimeFormat('en', {
      weekday: 'short',
    }).format(date),
    date: new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    }).format(date),
  }
}

function formatTime(timeValue) {
  if (!timeValue) {
    return '—'
  }

  if (timeValue.includes('T')) {
    return timeValue
      .split('T')[1]
      .slice(0, 5)
  }

  return timeValue
}

function WeatherDayList({
  days,
  units,
  showPrecipitationProbability = false,
}) {
  if (!Array.isArray(days) || days.length === 0) {
    return null
  }

  return (
    <div className="weather-day-list">
      <ul className="weather-day-list__track">
        {days.map((day) => {
          const formattedDate =
            formatWeatherDate(day.date)

          return (
            <li
              key={day.date}
              className="weather-day-list__item"
            >
              <div className="weather-day-list__header">
                <div>
                  <p className="weather-day-list__weekday">
                    {formattedDate.weekday}
                  </p>

                  <h3 className="weather-day-list__date">
                    {formattedDate.date}
                  </h3>
                </div>

                <span
                  className="weather-day-list__weather-icon"
                  aria-hidden="true"
                >
                  <TemperatureIcon />
                </span>
              </div>

              <div className="weather-day-list__temperature">
                <span className="weather-day-list__temperature-min">
                  {day.minimumTemperature}
                  {units.temperature}
                </span>

                <span
                  className="weather-day-list__temperature-arrow"
                  aria-hidden="true"
                >
                  →
                </span>

                <span className="weather-day-list__temperature-max">
                  {day.maximumTemperature}
                  {units.temperature}
                </span>
              </div>

              <div className="weather-day-list__metrics">
                <div className="weather-day-list__metric">
                  <span
                    className="weather-day-list__metric-icon"
                    aria-hidden="true"
                  >
                    <TemperatureIcon />
                  </span>

                  <div>
                    <p className="weather-day-list__metric-label">
                      Feels like
                    </p>

                    <p className="weather-day-list__metric-value">
                      {day.minimumApparentTemperature}
                      {units.temperature}
                      {' – '}
                      {day.maximumApparentTemperature}
                      {units.temperature}
                    </p>
                  </div>
                </div>

                {showPrecipitationProbability && (
                  <div className="weather-day-list__metric">
                    <span
                      className="weather-day-list__metric-icon"
                      aria-hidden="true"
                    >
                      <RainIcon />
                    </span>

                    <div>
                      <p className="weather-day-list__metric-label">
                        Rain chance
                      </p>

                      <p className="weather-day-list__metric-value">
                        {day.precipitationProbability}
                        {units.precipitationProbability}
                      </p>
                    </div>
                  </div>
                )}

                <div className="weather-day-list__metric">
                  <span
                    className="weather-day-list__metric-icon"
                    aria-hidden="true"
                  >
                    <RainIcon />
                  </span>

                  <div>
                    <p className="weather-day-list__metric-label">
                      Precipitation
                    </p>

                    <p className="weather-day-list__metric-value">
                      {day.precipitationSum}{' '}
                      {units.precipitation}
                    </p>
                  </div>
                </div>

                <div className="weather-day-list__metric">
                  <span
                    className="weather-day-list__metric-icon"
                    aria-hidden="true"
                  >
                    <WindIcon />
                  </span>

                  <div>
                    <p className="weather-day-list__metric-label">
                      Max wind
                    </p>

                    <p className="weather-day-list__metric-value">
                      {day.maximumWindSpeed}{' '}
                      {units.windSpeed}
                    </p>
                  </div>
                </div>
              </div>

              <div className="weather-day-list__sun">
                <div className="weather-day-list__sun-item">
                  <span
                    className="weather-day-list__sun-icon"
                    aria-hidden="true"
                  >
                    <SunIcon />
                  </span>

                  <div>
                    <p className="weather-day-list__sun-label">
                      Sunrise
                    </p>

                    <p className="weather-day-list__sun-value">
                      {formatTime(day.sunrise)}
                    </p>
                  </div>
                </div>

                <div className="weather-day-list__sun-item">
                  <span
                    className="weather-day-list__sun-icon"
                    aria-hidden="true"
                  >
                    <SunIcon />
                  </span>

                  <div>
                    <p className="weather-day-list__sun-label">
                      Sunset
                    </p>

                    <p className="weather-day-list__sun-value">
                      {formatTime(day.sunset)}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default WeatherDayList