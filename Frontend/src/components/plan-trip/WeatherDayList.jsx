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

/* Main colorful weather icons */

function ClearWeatherIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        className="weather-icon__sun"
        cx="32"
        cy="32"
        r="12"
      />

      <g
        className="weather-icon__sun-rays"
        strokeLinecap="round"
        strokeWidth="4"
      >
        <path d="M32 7v7" />
        <path d="M32 50v7" />
        <path d="M7 32h7" />
        <path d="M50 32h7" />
        <path d="m14.3 14.3 5 5" />
        <path d="m44.7 44.7 5 5" />
        <path d="m14.3 49.7 5-5" />
        <path d="m44.7 19.3 5-5" />
      </g>
    </svg>
  )
}

function PartlyCloudyWeatherIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        className="weather-icon__sun"
        cx="23"
        cy="22"
        r="10"
      />

      <g
        className="weather-icon__sun-rays"
        strokeLinecap="round"
        strokeWidth="3.4"
      >
        <path d="M23 6v5" />
        <path d="M23 33v5" />
        <path d="M7 22h5" />
        <path d="M34 22h5" />
        <path d="m11.7 10.7 3.5 3.5" />
        <path d="m30.8 29.8 3.5 3.5" />
      </g>

      <path
        className="weather-icon__cloud"
        d="M19 50h29a9 9 0 0 0 1.2-17.9A13.5 13.5 0 0 0 24 36a8 8 0 0 0-5 14Z"
      />
    </svg>
  )
}

function CloudyWeatherIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="weather-icon__cloud-back"
        d="M12 42h29a9 9 0 0 0 1.2-17.9A13.5 13.5 0 0 0 17 28a8 8 0 0 0-5 14Z"
      />

      <path
        className="weather-icon__cloud"
        d="M24 52h27a8 8 0 0 0 1.1-15.9A12 12 0 0 0 29.6 39 7 7 0 0 0 24 52Z"
      />
    </svg>
  )
}

function RainWeatherIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="weather-icon__cloud"
        d="M13 38h37a10 10 0 0 0 1.4-19.9A15 15 0 0 0 23 22a9 9 0 0 0-10 16Z"
      />

      <g
        className="weather-icon__rain"
        strokeLinecap="round"
        strokeWidth="4"
      >
        <path d="m22 45-3 7" />
        <path d="m34 45-3 7" />
        <path d="m46 45-3 7" />
      </g>
    </svg>
  )
}

function SnowWeatherIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="weather-icon__cloud"
        d="M13 36h37a10 10 0 0 0 1.4-19.9A15 15 0 0 0 23 20a9 9 0 0 0-10 16Z"
      />

      <g
        className="weather-icon__snow"
        strokeLinecap="round"
        strokeWidth="2.6"
      >
        <path d="M23 43v13" />
        <path d="m18 46 10 7" />
        <path d="m28 46-10 7" />

        <path d="M43 43v13" />
        <path d="m38 46 10 7" />
        <path d="m48 46-10 7" />
      </g>
    </svg>
  )
}

function FogWeatherIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="weather-icon__cloud"
        d="M14 34h36a9 9 0 0 0 1.3-17.9A14 14 0 0 0 25 20a8 8 0 0 0-11 14Z"
      />

      <g
        className="weather-icon__fog"
        strokeLinecap="round"
        strokeWidth="4"
      >
        <path d="M13 44h38" />
        <path d="M19 53h30" />
      </g>
    </svg>
  )
}

function StormWeatherIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="weather-icon__storm-cloud"
        d="M13 36h37a10 10 0 0 0 1.4-19.9A15 15 0 0 0 23 20a9 9 0 0 0-10 16Z"
      />

      <path
        className="weather-icon__lightning"
        d="M34 39 26 51h7l-3 9 11-15h-7l5-6Z"
      />
    </svg>
  )
}

function getWeatherCondition(weatherCode) {
  const code = Number(weatherCode)

  if (code === 0) {
    return {
      type: 'clear',
      label: 'Clear sky',
    }
  }

  if (code === 1) {
    return {
      type: 'partly-cloudy',
      label: 'Mostly clear',
    }
  }

  if (code === 2) {
    return {
      type: 'partly-cloudy',
      label: 'Partly cloudy',
    }
  }

  if (code === 3) {
    return {
      type: 'cloudy',
      label: 'Overcast',
    }
  }

  if ([45, 48].includes(code)) {
    return {
      type: 'fog',
      label: 'Foggy',
    }
  }

  if (
    [
      51,
      53,
      55,
      56,
      57,
    ].includes(code)
  ) {
    return {
      type: 'rain',
      label: 'Drizzle',
    }
  }

  if (
    [
      61,
      63,
      65,
      66,
      67,
      80,
      81,
      82,
    ].includes(code)
  ) {
    return {
      type: 'rain',
      label: 'Rain',
    }
  }

  if (
    [
      71,
      73,
      75,
      77,
      85,
      86,
    ].includes(code)
  ) {
    return {
      type: 'snow',
      label: 'Snow',
    }
  }

  if ([95, 96, 99].includes(code)) {
    return {
      type: 'storm',
      label: 'Thunderstorm',
    }
  }

  return {
    type: 'cloudy',
    label: 'Weather',
  }
}

function WeatherConditionIcon({
  type,
}) {
  switch (type) {
    case 'clear':
      return <ClearWeatherIcon />

    case 'partly-cloudy':
      return <PartlyCloudyWeatherIcon />

    case 'rain':
      return <RainWeatherIcon />

    case 'snow':
      return <SnowWeatherIcon />

    case 'fog':
      return <FogWeatherIcon />

    case 'storm':
      return <StormWeatherIcon />

    default:
      return <CloudyWeatherIcon />
  }
}

function getDateOnlyValue(dateValue) {
  if (!dateValue) {
    return null
  }

  const [year, month, day] = dateValue
    .slice(0, 10)
    .split('-')
    .map(Number)

  return new Date(
    year,
    month - 1,
    day,
  )
}

function formatWeatherDate(dateValue) {
  const date =
    getDateOnlyValue(dateValue)

  if (!date) {
    return {
      weekday: '',
      date: dateValue,
    }
  }

  return {
    weekday: new Intl.DateTimeFormat(
      'en',
      {
        weekday: 'short',
      },
    ).format(date),

    date: new Intl.DateTimeFormat(
      'en',
      {
        month: 'short',
        day: 'numeric',
      },
    ).format(date),
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
  if (
    !Array.isArray(days) ||
    days.length === 0
  ) {
    return null
  }

  return (
    <div className="weather-day-list">
      <ul className="weather-day-list__track">
        {days.map((day) => {
          const formattedDate =
            formatWeatherDate(day.date)

          const condition =
            getWeatherCondition(
              day.weatherCode,
            )

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

                  <p className="weather-day-list__condition">
                    {condition.label}
                  </p>
                </div>

                <span
                  className={`weather-day-list__weather-icon weather-day-list__weather-icon--${condition.type}`}
                  title={condition.label}
                  aria-hidden="true"
                >
                  <WeatherConditionIcon
                    type={condition.type}
                  />
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
                        {
                          units.precipitationProbability
                        }
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