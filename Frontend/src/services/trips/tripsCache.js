const TRIPS_CACHE_TTL =
  24 * 60 * 60 * 1000

function readLocalStorageValue(cacheKey) {
  try {
    return window.localStorage.getItem(cacheKey)
  } catch {
    return null
  }
}

function writeLocalStorageValue(
  cacheKey,
  cacheValue,
) {
  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify(cacheValue),
    )
  } catch {
    // Browser storage is optional.
  }
}

function removeLocalStorageValue(cacheKey) {
  try {
    window.localStorage.removeItem(cacheKey)
  } catch {
    // Cache cleanup is best-effort only.
  }
}

export function getTripsCacheKey(userId) {
  return `travelPlannerTrips:${userId}`
}

export function readTripsCache(userId) {
  if (!userId) {
    return null
  }

  const cacheKey = getTripsCacheKey(userId)

  const cachedValue =
    readLocalStorageValue(cacheKey)

  if (!cachedValue) {
    return null
  }

  try {
    const parsedCache = JSON.parse(cachedValue)

    const isValidCache =
      Array.isArray(parsedCache.trips) &&
      typeof parsedCache.savedAt === 'number' &&
      typeof parsedCache.isComplete === 'boolean'

    if (!isValidCache) {
      removeLocalStorageValue(cacheKey)
      return null
    }

    const isExpired =
      Date.now() - parsedCache.savedAt >
      TRIPS_CACHE_TTL

    if (isExpired) {
      removeLocalStorageValue(cacheKey)
      return null
    }

    return {
      trips: parsedCache.trips,
      isComplete: parsedCache.isComplete,
    }
  } catch {
    removeLocalStorageValue(cacheKey)
    return null
  }
}

export function writeTripsCache(
  userId,
  trips,
  isComplete,
) {
  if (!userId) {
    return
  }

  const cacheKey = getTripsCacheKey(userId)

  writeLocalStorageValue(
    cacheKey,
    {
      trips,
      isComplete,
      savedAt: Date.now(),
    },
  )
}

export function removeTripsCache(userId) {
  if (!userId) {
    return
  }

  removeLocalStorageValue(
    getTripsCacheKey(userId),
  )
}
