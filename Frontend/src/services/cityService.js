import { apiRequest } from './apiClient'

const MAJOR_CITIES_CACHE_KEY_PREFIX =
  'travelPlannerMajorCities'

const CITY_SEARCH_CACHE_KEY_PREFIX =
  'travelPlannerCitySearch'

const MAJOR_CITIES_CACHE_DURATION_MS =
  24 * 60 * 60 * 1000

const CITY_SEARCH_CACHE_DURATION_MS =
  60 * 60 * 1000

const majorCitiesMemoryCache = new Map()
const majorCitiesRequests = new Map()

const citySearchMemoryCache = new Map()
const citySearchRequests = new Map()

function normalizeCountryCode(countryCode) {
  if (typeof countryCode !== 'string') {
    throw new Error('Country code is required.')
  }

  const normalizedCountryCode =
    countryCode.trim().toUpperCase()

  if (
    normalizedCountryCode.length !== 2 ||
    !/^[A-Z]{2}$/.test(normalizedCountryCode)
  ) {
    throw new Error(
      'Country code must contain exactly two letters.',
    )
  }

  return normalizedCountryCode
}

function normalizeQuery(query) {
  if (typeof query !== 'string') {
    return ''
  }

  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

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

function validateCitiesResponse(cities) {
  if (!Array.isArray(cities)) {
    throw new Error(
      'Cities API returned an invalid response.',
    )
  }

  return cities
}

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

function getMajorCitiesFromSessionStorage(countryCode) {
  const storageKey =
    createMajorCitiesStorageKey(countryCode)

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

    if (cacheAge >= MAJOR_CITIES_CACHE_DURATION_MS) {
      sessionStorage.removeItem(storageKey)

      return null
    }

    return parsedCache.cities
  } catch {
    sessionStorage.removeItem(storageKey)

    return null
  }
}

function saveMajorCitiesToSessionStorage(
  countryCode,
  cities,
) {
  const storageKey =
    createMajorCitiesStorageKey(countryCode)

  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        cities,
        cachedAt: Date.now(),
      }),
    )
  } catch (error) {
    console.warn(
      'Could not cache major cities in session storage:',
      error,
    )
  }
}

function getCitySearchFromSessionStorage(
  countryCode,
  query,
) {
  const storageKey =
    createCitySearchStorageKey(countryCode, query)

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

    if (cacheAge >= CITY_SEARCH_CACHE_DURATION_MS) {
      sessionStorage.removeItem(storageKey)

      return null
    }

    return parsedCache.cities
  } catch {
    sessionStorage.removeItem(storageKey)

    return null
  }
}

function saveCitySearchToSessionStorage(
  countryCode,
  query,
  cities,
) {
  const storageKey =
    createCitySearchStorageKey(countryCode, query)

  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        cities,
        cachedAt: Date.now(),
      }),
    )
  } catch (error) {
    console.warn(
      'Could not cache city search in session storage:',
      error,
    )
  }
}

function getCitiesFromMemoryCache(cache, cacheKey) {
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

function createSharedRequest(
  requestsMap,
  requestKey,
  endpoint,
  onSuccess,
) {
  const controller = new AbortController()

  const requestEntry = {
    controller,
    consumerCount: 0,
    completed: false,
    promise: null,
  }

  requestEntry.promise = apiRequest(
    endpoint,
    {
      signal: controller.signal,
    },
  )
    .then(validateCitiesResponse)
    .then((cities) => {
      onSuccess(cities)

      return cities
    })
    .finally(() => {
      requestEntry.completed = true

      if (
        requestsMap.get(requestKey) === requestEntry
      ) {
        requestsMap.delete(requestKey)
      }
    })

  requestsMap.set(requestKey, requestEntry)

  return requestEntry
}

function subscribeToSharedRequest(
  requestsMap,
  requestKey,
  requestEntry,
  signal,
) {
  throwIfAborted(signal)

  requestEntry.consumerCount += 1

  return new Promise((resolve, reject) => {
    let isSettled = false

    function cleanup() {
      if (isSettled) {
        return false
      }

      isSettled = true

      signal?.removeEventListener(
        'abort',
        handleAbort,
      )

      requestEntry.consumerCount -= 1

      if (
        requestEntry.consumerCount === 0 &&
        !requestEntry.completed
      ) {
        if (
          requestsMap.get(requestKey) ===
          requestEntry
        ) {
          requestsMap.delete(requestKey)
        }

        requestEntry.controller.abort()
      }

      return true
    }

    function handleAbort() {
      if (!cleanup()) {
        return
      }

      reject(createAbortError())
    }

    signal?.addEventListener(
      'abort',
      handleAbort,
      {
        once: true,
      },
    )

    if (signal?.aborted) {
      handleAbort()

      return
    }

    requestEntry.promise.then(
      (cities) => {
        if (!cleanup()) {
          return
        }

        resolve(cities)
      },
      (error) => {
        if (!cleanup()) {
          return
        }

        reject(error)
      },
    )
  })
}

export async function getMajorCities(
  countryCode,
  signal = null,
) {
  throwIfAborted(signal)

  const normalizedCountryCode =
    normalizeCountryCode(countryCode)

  const cachedCities =
    getCitiesFromMemoryCache(
      majorCitiesMemoryCache,
      normalizedCountryCode,
    )

  if (cachedCities) {
    return cachedCities
  }

  const sessionCities =
    getMajorCitiesFromSessionStorage(
      normalizedCountryCode,
    )

  if (sessionCities) {
    saveCitiesToMemoryCache(
      majorCitiesMemoryCache,
      normalizedCountryCode,
      sessionCities,
      MAJOR_CITIES_CACHE_DURATION_MS,
    )

    return sessionCities
  }

  let requestEntry =
    majorCitiesRequests.get(
      normalizedCountryCode,
    )

  if (!requestEntry) {
    const endpoint =
      `/api/Destinations/countries/` +
      `${encodeURIComponent(normalizedCountryCode)}` +
      `/cities/major`

    requestEntry = createSharedRequest(
      majorCitiesRequests,
      normalizedCountryCode,
      endpoint,
      (cities) => {
        saveCitiesToMemoryCache(
          majorCitiesMemoryCache,
          normalizedCountryCode,
          cities,
          MAJOR_CITIES_CACHE_DURATION_MS,
        )

        saveMajorCitiesToSessionStorage(
          normalizedCountryCode,
          cities,
        )
      },
    )
  }

  return subscribeToSharedRequest(
    majorCitiesRequests,
    normalizedCountryCode,
    requestEntry,
    signal,
  )
}

export async function searchCities(
  countryCode,
  query,
  signal = null,
) {
  throwIfAborted(signal)

  const normalizedCountryCode =
    normalizeCountryCode(countryCode)

  const normalizedQuery =
    normalizeQuery(query)

  if (normalizedQuery.length < 2) {
    return []
  }

  const requestKey =
    `${normalizedCountryCode}:${normalizedQuery}`

  const cachedCities =
    getCitiesFromMemoryCache(
      citySearchMemoryCache,
      requestKey,
    )

  if (cachedCities) {
    return cachedCities
  }

  const sessionCities =
    getCitySearchFromSessionStorage(
      normalizedCountryCode,
      normalizedQuery,
    )

  if (sessionCities) {
    saveCitiesToMemoryCache(
      citySearchMemoryCache,
      requestKey,
      sessionCities,
      CITY_SEARCH_CACHE_DURATION_MS,
    )

    return sessionCities
  }

  let requestEntry =
    citySearchRequests.get(requestKey)

  if (!requestEntry) {
    const endpoint =
      `/api/Destinations/countries/` +
      `${encodeURIComponent(normalizedCountryCode)}` +
      `/cities?query=` +
      `${encodeURIComponent(normalizedQuery)}`

    requestEntry = createSharedRequest(
      citySearchRequests,
      requestKey,
      endpoint,
      (cities) => {
        saveCitiesToMemoryCache(
          citySearchMemoryCache,
          requestKey,
          cities,
          CITY_SEARCH_CACHE_DURATION_MS,
        )

        saveCitySearchToSessionStorage(
          normalizedCountryCode,
          normalizedQuery,
          cities,
        )
      },
    )
  }

  return subscribeToSharedRequest(
    citySearchRequests,
    requestKey,
    requestEntry,
    signal,
  )
}