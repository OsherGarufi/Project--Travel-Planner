import { apiRequest } from './apiClient'

const CACHE_KEY = 'trip-daily-tip'

let inFlightRequest = null

export function getDailyTravelTip() {
  const cachedTip = getCachedTip()

  if (cachedTip) {
    return Promise.resolve(cachedTip)
  }

  if (!inFlightRequest) {
    inFlightRequest = apiRequest(
      '/api/Home/daily-travel-tip',
    )
      .then((tip) => {
        if (isValidTip(tip)) {
          storeTip(tip)
        }

        return tip
      })
      .finally(() => {
        inFlightRequest = null
      })
  }

  return inFlightRequest
}

function getCachedTip() {
  try {
    const storedValue =
      localStorage.getItem(CACHE_KEY)

    if (!storedValue) {
      return null
    }

    const cachedEntry = JSON.parse(storedValue)
    const expiresAt = Date.parse(
      cachedEntry?.expiresAt,
    )

    if (
      !isValidTip(cachedEntry) ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      localStorage.removeItem(CACHE_KEY)

      return null
    }

    return {
      title: cachedEntry.title,
      tip: cachedEntry.tip,
    }
  } catch {
    removeCachedTip()

    return null
  }
}

function storeTip(tip) {
  const now = new Date()

  const expiresAt = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
    ),
  ).toISOString()

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        title: tip.title,
        tip: tip.tip,
        expiresAt,
      }),
    )
  } catch {
    // Storage can be unavailable without affecting the request.
  }
}

function removeCachedTip() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // Storage can be unavailable without affecting the request.
  }
}

function isValidTip(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    typeof value.tip === 'string' &&
    value.tip.trim().length > 0
  )
}
