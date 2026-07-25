import {
    FORECAST_API_URL,
    FORECAST_DAILY_VARIABLES,
    HISTORICAL_API_URL,
    HISTORICAL_DAILY_VARIABLES,
    WEATHER_FORECAST_DAYS,
} from './weatherConstants'

function createAbortError() {
  return new DOMException(
    'The request was aborted.',
    'AbortError',
  )
}

export function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw createAbortError()
  }
}

async function readResponseBody(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function requestWeatherData(
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

export function createForecastEndpoint(
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

export function createHistoricalEndpoint(
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