import {
  getCachedCitySearch,
  getCachedMajorCities,
  saveCitySearchToCache,
  saveMajorCitiesToCache,
} from './cityCache'
import {
  MIN_CITY_SEARCH_QUERY_LENGTH,
} from './cityConstants'
import {
  createSharedCityRequest,
  subscribeToSharedCityRequest,
  throwIfAborted,
} from './cityRequestManager'
import {
  normalizeCitySearchQuery,
  normalizeCountryCode,
} from './cityValidation'

const majorCitiesRequests = new Map()
const citySearchRequests = new Map()

export async function getMajorCities(
  countryCode,
  signal = null,
) {
  throwIfAborted(signal)

  const normalizedCountryCode =
    normalizeCountryCode(countryCode)

  const cachedCities =
    getCachedMajorCities(
      normalizedCountryCode,
    )

  if (cachedCities) {
    return cachedCities
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

    requestEntry = createSharedCityRequest(
      majorCitiesRequests,
      normalizedCountryCode,
      endpoint,
      (cities) => {
        saveMajorCitiesToCache(
          normalizedCountryCode,
          cities,
        )
      },
    )
  }

  return subscribeToSharedCityRequest(
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
    normalizeCitySearchQuery(query)

  if (
    normalizedQuery.length <
    MIN_CITY_SEARCH_QUERY_LENGTH
  ) {
    return []
  }

  const requestKey =
    `${normalizedCountryCode}:${normalizedQuery}`

  const cachedCities =
    getCachedCitySearch(
      normalizedCountryCode,
      normalizedQuery,
    )

  if (cachedCities) {
    return cachedCities
  }

  let requestEntry =
    citySearchRequests.get(requestKey)

  if (!requestEntry) {
    const endpoint =
      `/api/Destinations/countries/` +
      `${encodeURIComponent(normalizedCountryCode)}` +
      `/cities?query=` +
      `${encodeURIComponent(normalizedQuery)}`

    requestEntry = createSharedCityRequest(
      citySearchRequests,
      requestKey,
      endpoint,
      (cities) => {
        saveCitySearchToCache(
          normalizedCountryCode,
          normalizedQuery,
          cities,
        )
      },
    )
  }

  return subscribeToSharedCityRequest(
    citySearchRequests,
    requestKey,
    requestEntry,
    signal,
  )
}