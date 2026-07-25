import {
    FORECAST_CACHE_DURATION_MS,
    FORECAST_CACHE_KEY_PREFIX,
    HISTORICAL_CACHE_KEY_PREFIX,
} from './weatherConstants'

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

export function getCachedForecastWeather(
  latitude,
  longitude,
) {
  const cacheKey = createForecastCacheKey(
    latitude,
    longitude,
  )

  return getWeatherFromSessionStorage(
    cacheKey,
    FORECAST_CACHE_DURATION_MS,
  )
}

export function saveForecastWeatherToCache(
  latitude,
  longitude,
  weatherData,
) {
  const cacheKey = createForecastCacheKey(
    latitude,
    longitude,
  )

  saveWeatherToSessionStorage(
    cacheKey,
    weatherData,
  )
}

export function getCachedHistoricalWeather(
  latitude,
  longitude,
  startDate,
  endDate,
) {
  const cacheKey = createHistoricalCacheKey(
    latitude,
    longitude,
    startDate,
    endDate,
  )

  return getWeatherFromSessionStorage(cacheKey)
}

export function saveHistoricalWeatherToCache(
  latitude,
  longitude,
  startDate,
  endDate,
  weatherData,
) {
  const cacheKey = createHistoricalCacheKey(
    latitude,
    longitude,
    startDate,
    endDate,
  )

  saveWeatherToSessionStorage(
    cacheKey,
    weatherData,
  )
}