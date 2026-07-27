import {
    CITY_SEARCH_CACHE_DURATION_MS,
    CITY_SEARCH_CACHE_KEY_PREFIX,
    MAJOR_CITIES_CACHE_DURATION_MS,
    MAJOR_CITIES_CACHE_KEY_PREFIX,
} from './cityConstants'

const majorCitiesMemoryCache = new Map()
const citySearchMemoryCache = new Map()

function createMajorCitiesStorageKey(countryCode) {
  return `${MAJOR_CITIES_CACHE_KEY_PREFIX}:${countryCode}`
}

function createCitySearchStorageKey(
  countryCode,
  query,
) {
  return (
    `${CITY_SEARCH_CACHE_KEY_PREFIX}:` +
    `${countryCode}:` +
    `${encodeURIComponent(query)}`
  )
}

function getCitiesFromSessionStorage(
  storageKey,
  cacheDuration,
) {
  const cachedValue =
    sessionStorage.getItem(storageKey)

  if (!cachedValue) {
    return null
  }

  try {
    const parsedCache = JSON.parse(cachedValue)

    const isValidCache =
      Array.isArray(parsedCache.cities) &&
      typeof parsedCache.cachedAt === 'number'

    if (!isValidCache) {
      sessionStorage.removeItem(storageKey)

      return null
    }

    const cacheAge =
      Date.now() - parsedCache.cachedAt

    if (cacheAge >= cacheDuration) {
      sessionStorage.removeItem(storageKey)

      return null
    }

    return parsedCache.cities
  } catch {
    sessionStorage.removeItem(storageKey)

    return null
  }
}

function saveCitiesToSessionStorage(
  storageKey,
  cities,
  warningMessage,
) {
  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        cities,
        cachedAt: Date.now(),
      }),
    )
  } catch (error) {
    console.warn(warningMessage, error)
  }
}

function getCitiesFromMemoryCache(
  cache,
  cacheKey,
) {
  const cachedEntry = cache.get(cacheKey)

  if (!cachedEntry) {
    return null
  }

  const cacheAge =
    Date.now() - cachedEntry.cachedAt

  if (cacheAge >= cachedEntry.duration) {
    cache.delete(cacheKey)

    return null
  }

  return cachedEntry.cities
}

function saveCitiesToMemoryCache(
  cache,
  cacheKey,
  cities,
  duration,
) {
  cache.set(cacheKey, {
    cities,
    cachedAt: Date.now(),
    duration,
  })
}

export function getCachedMajorCities(
  countryCode,
) {
  const memoryCities =
    getCitiesFromMemoryCache(
      majorCitiesMemoryCache,
      countryCode,
    )

  if (memoryCities) {
    return memoryCities
  }

  const storageKey =
    createMajorCitiesStorageKey(countryCode)

  const sessionCities =
    getCitiesFromSessionStorage(
      storageKey,
      MAJOR_CITIES_CACHE_DURATION_MS,
    )

  if (!sessionCities) {
    return null
  }

  saveCitiesToMemoryCache(
    majorCitiesMemoryCache,
    countryCode,
    sessionCities,
    MAJOR_CITIES_CACHE_DURATION_MS,
  )

  return sessionCities
}

export function saveMajorCitiesToCache(
  countryCode,
  cities,
) {
  saveCitiesToMemoryCache(
    majorCitiesMemoryCache,
    countryCode,
    cities,
    MAJOR_CITIES_CACHE_DURATION_MS,
  )

  const storageKey =
    createMajorCitiesStorageKey(countryCode)

  saveCitiesToSessionStorage(
    storageKey,
    cities,
    'Could not cache major cities in session storage:',
  )
}

export function getCachedCitySearch(
  countryCode,
  query,
) {
  const cacheKey =
    `${countryCode}:${query}`

  const memoryCities =
    getCitiesFromMemoryCache(
      citySearchMemoryCache,
      cacheKey,
    )

  if (memoryCities) {
    return memoryCities
  }

  const storageKey =
    createCitySearchStorageKey(
      countryCode,
      query,
    )

  const sessionCities =
    getCitiesFromSessionStorage(
      storageKey,
      CITY_SEARCH_CACHE_DURATION_MS,
    )

  if (!sessionCities) {
    return null
  }

  saveCitiesToMemoryCache(
    citySearchMemoryCache,
    cacheKey,
    sessionCities,
    CITY_SEARCH_CACHE_DURATION_MS,
  )

  return sessionCities
}

export function saveCitySearchToCache(
  countryCode,
  query,
  cities,
) {
  const cacheKey =
    `${countryCode}:${query}`

  saveCitiesToMemoryCache(
    citySearchMemoryCache,
    cacheKey,
    cities,
    CITY_SEARCH_CACHE_DURATION_MS,
  )

  const storageKey =
    createCitySearchStorageKey(
      countryCode,
      query,
    )

  saveCitiesToSessionStorage(
    storageKey,
    cities,
    'Could not cache city search in session storage:',
  )
}