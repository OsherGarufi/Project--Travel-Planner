const TRIPS_CACHE_TTL =
  24 * 60 * 60 * 1000

function getTripsCacheKey(userId) {
  return `travelPlannerTrips:${userId}`
}

export function readTripsCache(userId) {
  if (!userId) {
    return null
  }

  const cacheKey = getTripsCacheKey(userId)

  try {
    const cachedValue =
      window.localStorage.getItem(cacheKey)

    if (!cachedValue) {
      return null
    }

    const parsedCache = JSON.parse(cachedValue)

    const isValidCache =
      Array.isArray(parsedCache.trips) &&
      typeof parsedCache.savedAt === 'number' &&
      typeof parsedCache.isComplete === 'boolean'

    if (!isValidCache) {
      window.localStorage.removeItem(cacheKey)
      return null
    }

    const isExpired =
      Date.now() - parsedCache.savedAt >
      TRIPS_CACHE_TTL

    if (isExpired) {
      window.localStorage.removeItem(cacheKey)
      return null
    }

    return {
      trips: parsedCache.trips,
      isComplete: parsedCache.isComplete,
    }
  } catch (error) {
    console.error(
      'Failed to read trips cache:',
      error,
    )

    window.localStorage.removeItem(cacheKey)

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

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        trips,
        isComplete,
        savedAt: Date.now(),
      }),
    )
  } catch (error) {
    console.error(
      'Failed to save trips cache:',
      error,
    )
  }
}

export function removeTripsCache(userId) {
  if (!userId) {
    return
  }

  window.localStorage.removeItem(
    getTripsCacheKey(userId),
  )
}