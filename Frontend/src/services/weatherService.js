const FORECAST_API_URL =
  'https://api.open-meteo.com/v1/forecast'

const HISTORICAL_API_URL =
  'https://archive-api.open-meteo.com/v1/archive'

const FORECAST_CACHE_KEY_PREFIX =
  'travelPlannerWeatherForecast'

const HISTORICAL_CACHE_KEY_PREFIX =
  'travelPlannerHistoricalWeather'

const FORECAST_CACHE_DURATION_MS =
  3*60 * 60 * 1000

export const WEATHER_FORECAST_DAYS = 14

export const WEATHER_ATTRIBUTION =
  'Weather data by Open-Meteo.com'

const FORECAST_DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
]

const HISTORICAL_DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
]

function createAbortError() {
  return new DOMException(
    'The request was aborted.',
    'AbortError',
  )
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw createAbortError()
  }
}

function normalizeCoordinate(
  value,
  coordinateName,
  minimumValue,
  maximumValue,
) {
  const normalizedValue = Number(value)

  if (!Number.isFinite(normalizedValue)) {
    throw new Error(
      `${coordinateName} must be a valid number.`,
    )
  }

  if (
    normalizedValue < minimumValue ||
    normalizedValue > maximumValue
  ) {
    throw new Error(
      `${coordinateName} is outside the valid range.`,
    )
  }

  return normalizedValue
}

function normalizeCoordinates(latitude, longitude) {
  return {
    latitude: normalizeCoordinate(
      latitude,
      'Latitude',
      -90,
      90,
    ),
    longitude: normalizeCoordinate(
      longitude,
      'Longitude',
      -180,
      180,
    ),
  }
}

function normalizeDate(date, fieldName) {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error(
      `${fieldName} must use the YYYY-MM-DD format.`,
    )
  }

  const [year, month, day] = date
    .split('-')
    .map(Number)

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day),
  )

  const isValidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day

  if (!isValidDate) {
    throw new Error(
      `${fieldName} must be a valid date.`,
    )
  }

  return date
}

function normalizeDateRange(startDate, endDate) {
  const normalizedStartDate = normalizeDate(
    startDate,
    'Start date',
  )

  const normalizedEndDate = normalizeDate(
    endDate,
    'End date',
  )

  if (normalizedEndDate < normalizedStartDate) {
    throw new Error(
      'End date cannot be earlier than start date.',
    )
  }

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
  }
}

function formatDatePart(value) {
  return String(value).padStart(2, '0')
}

function moveDateOneYearBack(date) {
  const [year, month, day] = date
    .split('-')
    .map(Number)

  const historicalYear = year - 1

  const lastDayOfHistoricalMonth =
    new Date(
      Date.UTC(historicalYear, month, 0),
    ).getUTCDate()

  const historicalDay = Math.min(
    day,
    lastDayOfHistoricalMonth,
  )

  return (
    `${historicalYear}-` +
    `${formatDatePart(month)}-` +
    `${formatDatePart(historicalDay)}`
  )
}

function createCoordinatesCachePart(
  latitude,
  longitude,
) {
  return (
    `${latitude.toFixed(4)}:` +
    `${longitude.toFixed(4)}`
  )
}

function createForecastCacheKey(
  latitude,
  longitude,
) {
  const coordinatesCachePart =
    createCoordinatesCachePart(
      latitude,
      longitude,
    )

  return (
    `${FORECAST_CACHE_KEY_PREFIX}:` +
    `${coordinatesCachePart}`
  )
}

function createHistoricalCacheKey(
  latitude,
  longitude,
  startDate,
  endDate,
) {
  const coordinatesCachePart =
    createCoordinatesCachePart(
      latitude,
      longitude,
    )

  return (
    `${HISTORICAL_CACHE_KEY_PREFIX}:` +
    `${coordinatesCachePart}:` +
    `${startDate}:${endDate}`
  )
}

function isValidCachedWeatherData(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    Array.isArray(data.days)
  )
}

function getWeatherFromSessionStorage(
  storageKey,
  cacheDuration = null,
) {
  if (typeof window === 'undefined') {
    return null
  }

  let cachedValue

  try {
    cachedValue =
      window.sessionStorage.getItem(storageKey)
  } catch {
    return null
  }

  if (!cachedValue) {
    return null
  }

  try {
    const parsedCache = JSON.parse(cachedValue)

    const isValidCache =
      typeof parsedCache.cachedAt === 'number' &&
      isValidCachedWeatherData(parsedCache.data)

    if (!isValidCache) {
      window.sessionStorage.removeItem(storageKey)

      return null
    }

    if (cacheDuration !== null) {
      const cacheAge =
        Date.now() - parsedCache.cachedAt

      if (cacheAge >= cacheDuration) {
        window.sessionStorage.removeItem(storageKey)

        return null
      }
    }

    return parsedCache.data
  } catch {
    try {
      window.sessionStorage.removeItem(storageKey)
    } catch {
      // The browser may block access to sessionStorage.
    }

    return null
  }
}

function saveWeatherToSessionStorage(
  storageKey,
  weatherData,
) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        data: weatherData,
        cachedAt: Date.now(),
      }),
    )
  } catch (error) {
    console.warn(
      'Could not cache weather data in session storage:',
      error,
    )
  }
}

async function readResponseBody(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function requestWeatherData(
  endpoint,
  signal,
) {
  throwIfAborted(signal)

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  const responseBody =
    await readResponseBody(response)

  if (
    !response.ok ||
    responseBody?.error === true
  ) {
    const errorReason =
      responseBody?.reason ||
      'The weather service returned an error.'

    throw new Error(errorReason)
  }

  if (
    responseBody === null ||
    typeof responseBody !== 'object' ||
    Array.isArray(responseBody)
  ) {
    throw new Error(
      'The weather service returned an invalid response.',
    )
  }

  return responseBody
}

function getRequiredDailyArray(
  daily,
  propertyName,
  expectedLength,
) {
  const propertyValue = daily[propertyName]

  if (
    !Array.isArray(propertyValue) ||
    propertyValue.length !== expectedLength
  ) {
    throw new Error(
      `Weather data is missing ${propertyName}.`,
    )
  }

  return propertyValue
}

function normalizeNullableNumber(
  value,
  propertyName,
) {
  if (value === null) {
    return null
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `Weather data contains an invalid ${propertyName}.`,
    )
  }

  return value
}

function normalizeNullableString(
  value,
  propertyName,
) {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new Error(
      `Weather data contains an invalid ${propertyName}.`,
    )
  }

  return value
}

function mapWeatherResponse(
  response,
  dataType,
) {
  const daily = response.daily

  if (
    daily === null ||
    typeof daily !== 'object' ||
    Array.isArray(daily)
  ) {
    throw new Error(
      'The weather service did not return daily data.',
    )
  }

  const dates = daily.time

  if (!Array.isArray(dates)) {
    throw new Error(
      'The weather service did not return valid dates.',
    )
  }

  const numberOfDays = dates.length

  const weatherCodes =
    getRequiredDailyArray(
      daily,
      'weather_code',
      numberOfDays,
    )

  const maximumTemperatures =
    getRequiredDailyArray(
      daily,
      'temperature_2m_max',
      numberOfDays,
    )

  const minimumTemperatures =
    getRequiredDailyArray(
      daily,
      'temperature_2m_min',
      numberOfDays,
    )

  const maximumApparentTemperatures =
    getRequiredDailyArray(
      daily,
      'apparent_temperature_max',
      numberOfDays,
    )

  const minimumApparentTemperatures =
    getRequiredDailyArray(
      daily,
      'apparent_temperature_min',
      numberOfDays,
    )

  const precipitationSums =
    getRequiredDailyArray(
      daily,
      'precipitation_sum',
      numberOfDays,
    )

  const maximumWindSpeeds =
    getRequiredDailyArray(
      daily,
      'wind_speed_10m_max',
      numberOfDays,
    )

  const sunrises =
    getRequiredDailyArray(
      daily,
      'sunrise',
      numberOfDays,
    )

  const sunsets =
    getRequiredDailyArray(
      daily,
      'sunset',
      numberOfDays,
    )

  const precipitationProbabilities =
    dataType === 'forecast'
      ? getRequiredDailyArray(
          daily,
          'precipitation_probability_max',
          numberOfDays,
        )
      : new Array(numberOfDays).fill(null)

  const days = dates.map((date, index) => ({
    date: normalizeNullableString(
      date,
      'date',
    ),
    weatherCode: normalizeNullableNumber(
      weatherCodes[index],
      'weather code',
    ),
    maximumTemperature:
      normalizeNullableNumber(
        maximumTemperatures[index],
        'maximum temperature',
      ),
    minimumTemperature:
      normalizeNullableNumber(
        minimumTemperatures[index],
        'minimum temperature',
      ),
    maximumApparentTemperature:
      normalizeNullableNumber(
        maximumApparentTemperatures[index],
        'maximum apparent temperature',
      ),
    minimumApparentTemperature:
      normalizeNullableNumber(
        minimumApparentTemperatures[index],
        'minimum apparent temperature',
      ),
    precipitationSum:
      normalizeNullableNumber(
        precipitationSums[index],
        'precipitation sum',
      ),
    precipitationProbability:
      normalizeNullableNumber(
        precipitationProbabilities[index],
        'precipitation probability',
      ),
    maximumWindSpeed:
      normalizeNullableNumber(
        maximumWindSpeeds[index],
        'maximum wind speed',
      ),
    sunrise: normalizeNullableString(
      sunrises[index],
      'sunrise',
    ),
    sunset: normalizeNullableString(
      sunsets[index],
      'sunset',
    ),
  }))

  return {
    dataType,
    source: 'Open-Meteo',
    attribution: WEATHER_ATTRIBUTION,
    latitude: response.latitude,
    longitude: response.longitude,
    elevation: response.elevation,
    timezone: response.timezone,
    timezoneAbbreviation:
      response.timezone_abbreviation,
    fetchedAt: new Date().toISOString(),
    units: {
      temperature:
        response.daily_units
          ?.temperature_2m_max ?? '°C',
      precipitation:
        response.daily_units
          ?.precipitation_sum ?? 'mm',
      precipitationProbability:
        dataType === 'forecast'
          ? response.daily_units
              ?.precipitation_probability_max ?? '%'
          : null,
      windSpeed:
        response.daily_units
          ?.wind_speed_10m_max ?? 'km/h',
    },
    days,
  }
}

function createForecastEndpoint(
  latitude,
  longitude,
) {
  const parameters = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    forecast_days: String(
      WEATHER_FORECAST_DAYS,
    ),
    daily: FORECAST_DAILY_VARIABLES.join(','),
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  })

  return `${FORECAST_API_URL}?${parameters}`
}

function createHistoricalEndpoint(
  latitude,
  longitude,
  startDate,
  endDate,
) {
  const parameters = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: startDate,
    end_date: endDate,
    daily: HISTORICAL_DAILY_VARIABLES.join(','),
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  })

  return `${HISTORICAL_API_URL}?${parameters}`
}

export async function getWeatherForecast(
  latitude,
  longitude,
  signal = null,
) {
  throwIfAborted(signal)

  const normalizedCoordinates =
    normalizeCoordinates(latitude, longitude)

  const cacheKey = createForecastCacheKey(
    normalizedCoordinates.latitude,
    normalizedCoordinates.longitude,
  )

  const cachedWeather =
    getWeatherFromSessionStorage(
      cacheKey,
      FORECAST_CACHE_DURATION_MS,
    )

  if (cachedWeather) {
    return cachedWeather
  }

  const endpoint = createForecastEndpoint(
    normalizedCoordinates.latitude,
    normalizedCoordinates.longitude,
  )

  const response = await requestWeatherData(
    endpoint,
    signal,
  )

  const weatherData = mapWeatherResponse(
    response,
    'forecast',
  )

  saveWeatherToSessionStorage(
    cacheKey,
    weatherData,
  )

  return weatherData
}

export async function getHistoricalWeather(
  latitude,
  longitude,
  tripStartDate,
  tripEndDate,
  signal = null,
) {
  throwIfAborted(signal)

  const normalizedCoordinates =
    normalizeCoordinates(latitude, longitude)

  const normalizedTripDates =
    normalizeDateRange(
      tripStartDate,
      tripEndDate,
    )

  const historicalStartDate =
    moveDateOneYearBack(
      normalizedTripDates.startDate,
    )

  const historicalEndDate =
    moveDateOneYearBack(
      normalizedTripDates.endDate,
    )

  const cacheKey = createHistoricalCacheKey(
    normalizedCoordinates.latitude,
    normalizedCoordinates.longitude,
    historicalStartDate,
    historicalEndDate,
  )

  const cachedWeather =
    getWeatherFromSessionStorage(cacheKey)

  if (cachedWeather) {
    return cachedWeather
  }

  const endpoint = createHistoricalEndpoint(
    normalizedCoordinates.latitude,
    normalizedCoordinates.longitude,
    historicalStartDate,
    historicalEndDate,
  )

  const response = await requestWeatherData(
    endpoint,
    signal,
  )

  const mappedWeatherData =
    mapWeatherResponse(response, 'historical')

  const weatherData = {
    ...mappedWeatherData,
    tripStartDate:
      normalizedTripDates.startDate,
    tripEndDate:
      normalizedTripDates.endDate,
    historicalStartDate,
    historicalEndDate,
  }

  saveWeatherToSessionStorage(
    cacheKey,
    weatherData,
  )

  return weatherData
}