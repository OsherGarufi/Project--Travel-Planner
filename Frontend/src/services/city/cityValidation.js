export function normalizeCountryCode(countryCode) {
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

export function normalizeCitySearchQuery(query) {
  if (typeof query !== 'string') {
    return ''
  }

  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function validateCitiesResponse(cities) {
  if (!Array.isArray(cities)) {
    throw new Error(
      'Cities API returned an invalid response.',
    )
  }

  return cities
}