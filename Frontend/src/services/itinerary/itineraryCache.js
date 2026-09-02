const ITINERARY_CACHE_TTL_MS =
  30 * 60 * 1000

function getCacheKey(
  userId,
  tripId,
) {
  return `trip-itinerary:${userId}:${tripId}`
}

export function getTripItineraryCache(
  userId,
  tripId,
) {
  if (
    !userId ||
    !tripId
  ) {
    return null
  }

  try {
    const cacheKey =
      getCacheKey(
        userId,
        tripId,
      )

    const rawValue =
      localStorage.getItem(
        cacheKey,
      )

    if (!rawValue) {
      return null
    }

    const parsedValue =
      JSON.parse(
        rawValue,
      )

    if (
      !Array.isArray(
        parsedValue?.items,
      ) ||
      typeof parsedValue?.cachedAt !==
        'number'
    ) {
      localStorage.removeItem(
        cacheKey,
      )

      return null
    }

    const isExpired =
      Date.now() -
        parsedValue.cachedAt >
      ITINERARY_CACHE_TTL_MS

    if (isExpired) {
      localStorage.removeItem(
        cacheKey,
      )

      return null
    }

    return parsedValue.items
  } catch {
    return null
  }
}

export function setTripItineraryCache(
  userId,
  tripId,
  items,
) {
  if (
    !userId ||
    !tripId ||
    !Array.isArray(items)
  ) {
    return
  }

  try {
    localStorage.setItem(
      getCacheKey(
        userId,
        tripId,
      ),
      JSON.stringify({
        items,
        cachedAt: Date.now(),
      }),
    )
  } catch {
    // Cache failures must never break
    // the itinerary experience.
  }
}

export function updateTripItineraryCacheForDateRange(
  userId,
  tripId,
  startDate,
  endDate,
) {
  if (
    !userId ||
    !tripId ||
    !startDate ||
    !endDate
  ) {
    return
  }

  const cachedItems =
    getTripItineraryCache(
      userId,
      tripId,
    )

  if (!cachedItems) {
    return
  }

  const nextItems =
    cachedItems.map(
      (item) => {
        if (!item.itineraryDate) {
          return item
        }

        const isOutsideTripRange =
          item.itineraryDate <
            startDate ||
          item.itineraryDate >
            endDate

        if (!isOutsideTripRange) {
          return item
        }

        return {
          ...item,
          itineraryDate: null,
          startTime: null,
          endTime: null,
        }
      },
    )

  setTripItineraryCache(
    userId,
    tripId,
    nextItems,
  )
}

export function clearTripItineraryCache(
  userId,
  tripId,
) {
  if (
    !userId ||
    !tripId
  ) {
    return
  }

  try {
    localStorage.removeItem(
      getCacheKey(
        userId,
        tripId,
      ),
    )
  } catch {
    // Cache cleanup is best-effort only.
  }
}