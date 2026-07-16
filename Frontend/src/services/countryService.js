import { apiRequest } from './apiClient'

const COUNTRIES_CACHE_KEY = 'travelPlannerCountries'
const COUNTRIES_CACHE_DURATION_MS = 24 * 60 * 60 * 1000

let countriesMemoryCache = null
let countriesRequestPromise = null

function getCountriesFromSessionStorage() {
  const cachedValue = sessionStorage.getItem(
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
      sessionStorage.removeItem(COUNTRIES_CACHE_KEY)

      return null
    }

    const cacheAge = Date.now() - parsedCache.cachedAt

    if (cacheAge >= COUNTRIES_CACHE_DURATION_MS) {
      sessionStorage.removeItem(COUNTRIES_CACHE_KEY)

      return null
    }

    return parsedCache.countries
  } catch {
    sessionStorage.removeItem(COUNTRIES_CACHE_KEY)

    return null
  }
}

function saveCountriesToSessionStorage(countries) {
  try {
    sessionStorage.setItem(
      COUNTRIES_CACHE_KEY,
      JSON.stringify({
        countries,
        cachedAt: Date.now(),
      }),
    )
  } catch (error) {
    console.warn(
      'Could not cache countries in session storage:',
      error,
    )
  }
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