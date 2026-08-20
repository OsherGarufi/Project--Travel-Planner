const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v2'

const CACHE_PREFIX = 'travelPlannerCurrencyRate'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 5000

function normalizeCurrency(currency) {
  if (typeof currency !== 'string') {
    return null
  }

  const normalizedCurrency = currency.trim().toUpperCase()

  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
    return null
  }

  return normalizedCurrency
}

function getCacheKey(fromCurrency, toCurrency) {
  return `${CACHE_PREFIX}:${fromCurrency}:${toCurrency}`
}

function readCachedRate(fromCurrency, toCurrency) {
  const cacheKey = getCacheKey(fromCurrency, toCurrency)

  try {
    const cachedValue = sessionStorage.getItem(cacheKey)

    if (!cachedValue) {
      return null
    }

    const parsedValue = JSON.parse(cachedValue)

    if (
      typeof parsedValue.rate !== 'number' ||
      !Number.isFinite(parsedValue.rate) ||
      parsedValue.rate <= 0 ||
      typeof parsedValue.cachedAt !== 'number'
    ) {
      sessionStorage.removeItem(cacheKey)
      return null
    }

    return parsedValue
  } catch {
    return null
  }
}

function writeCachedRate(fromCurrency, toCurrency, rateData) {
  const cacheKey = getCacheKey(fromCurrency, toCurrency)

  const cacheValue = {
    ...rateData,
    cachedAt: Date.now(),
  }

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheValue))
  } catch {
    // Currency conversion should continue working even if storage is unavailable.
  }
}

function isFreshCache(cachedRate) {
  return Date.now() - cachedRate.cachedAt < CACHE_TTL_MS
}

async function fetchRateFromFrankfurter(fromCurrency, toCurrency) {
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  )

  try {
    const response = await fetch(
      `${FRANKFURTER_BASE_URL}/rate/${encodeURIComponent(fromCurrency)}/${encodeURIComponent(toCurrency)}`,
      {
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      throw new Error('Currency API request failed')
    }

    const data = await response.json()

    if (
      typeof data.rate !== 'number' ||
      !Number.isFinite(data.rate) ||
      data.rate <= 0
    ) {
      throw new Error('Currency API returned an invalid rate')
    }

    return {
      from: fromCurrency,
      to: toCurrency,
      rate: data.rate,
      date: data.date ?? null,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getExchangeRate(fromCurrency, toCurrency) {
  const normalizedFromCurrency = normalizeCurrency(fromCurrency)
  const normalizedToCurrency = normalizeCurrency(toCurrency)

  if (!normalizedFromCurrency || !normalizedToCurrency) {
    return {
      status: 'unavailable',
      from: normalizedFromCurrency,
      to: normalizedToCurrency,
      rate: null,
      date: null,
    }
  }

  if (normalizedFromCurrency === normalizedToCurrency) {
    return {
      status: 'success',
      source: 'same-currency',
      from: normalizedFromCurrency,
      to: normalizedToCurrency,
      rate: 1,
      date: null,
    }
  }

  const cachedRate = readCachedRate(
    normalizedFromCurrency,
    normalizedToCurrency,
  )

  if (cachedRate && isFreshCache(cachedRate)) {
    return {
      status: 'success',
      source: 'cache',
      from: normalizedFromCurrency,
      to: normalizedToCurrency,
      rate: cachedRate.rate,
      date: cachedRate.date ?? null,
    }
  }

  try {
    const rateData = await fetchRateFromFrankfurter(
      normalizedFromCurrency,
      normalizedToCurrency,
    )

    writeCachedRate(
      normalizedFromCurrency,
      normalizedToCurrency,
      rateData,
    )

    return {
      status: 'success',
      source: 'api',
      ...rateData,
    }
  } catch {
    if (cachedRate) {
      return {
        status: 'stale',
        source: 'cache',
        from: normalizedFromCurrency,
        to: normalizedToCurrency,
        rate: cachedRate.rate,
        date: cachedRate.date ?? null,
      }
    }

    return {
      status: 'unavailable',
      from: normalizedFromCurrency,
      to: normalizedToCurrency,
      rate: null,
      date: null,
    }
  }
}