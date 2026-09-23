import { apiRequest } from './apiClient'

const COUNTRIES_CACHE_KEY = 'travelPlannerCountries'
const COUNTRIES_CACHE_DURATION_MS = 24 * 60 * 60 * 1000

let countriesMemoryCache = null
let countriesRequestPromise = null

function readSessionStorageValue(cacheKey) {
  try {
    return sessionStorage.getItem(cacheKey)
  } catch {
    return null
  }
}

function writeSessionStorageValue(
  cacheKey,
  cacheValue,
) {
  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify(cacheValue),
    )
  } catch {
    // Browser storage is optional.
  }
}

function removeSessionStorageValue(cacheKey) {
  try {
    sessionStorage.removeItem(cacheKey)
  } catch {
    // Cache cleanup is best-effort only.
  }
}

function getCountriesFromSessionStorage() {
  const cachedValue =
    readSessionStorageValue(
      COUNTRIES_CACHE_KEY,
    )

  if (!cachedValue) {
    return null
  }

  try {
    const parsedCache = JSON.parse(cachedValue)

    const isValidCache =
      Array.isArray(parsedCache.countries) &&
      typeof parsedCache.cachedAt === 'number'

    if (!isValidCache) {
      removeSessionStorageValue(
        COUNTRIES_CACHE_KEY,
      )

      return null
    }

    const cacheAge = Date.now() - parsedCache.cachedAt

    if (cacheAge >= COUNTRIES_CACHE_DURATION_MS) {
      removeSessionStorageValue(
        COUNTRIES_CACHE_KEY,
      )

      return null
    }

    return parsedCache.countries
  } catch {
    removeSessionStorageValue(
      COUNTRIES_CACHE_KEY,
    )

    return null
  }
}

function saveCountriesToSessionStorage(countries) {
  writeSessionStorageValue(
    COUNTRIES_CACHE_KEY,
    {
      countries,
      cachedAt: Date.now(),
    },
  )
}

export async function getCountries() {
  if (countriesMemoryCache) {
    return countriesMemoryCache
  }

  const sessionCountries =
    getCountriesFromSessionStorage()

  if (sessionCountries) {
    countriesMemoryCache = sessionCountries

    return sessionCountries
  }

  if (countriesRequestPromise) {
    return countriesRequestPromise
  }

  countriesRequestPromise = apiRequest(
    '/api/Destinations/countries',
  )
    .then((countries) => {
      if (!Array.isArray(countries)) {
        throw new Error(
          'Countries API returned an invalid response.',
        )
      }

      countriesMemoryCache = countries

      saveCountriesToSessionStorage(countries)

      return countries
    })
    .finally(() => {
      countriesRequestPromise = null
    })

  return countriesRequestPromise
}
