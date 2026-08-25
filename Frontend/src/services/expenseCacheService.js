const EXPENSES_CACHE_PREFIX =
  'travelPlanner:trip-expenses'

const EXPENSES_CACHE_TTL_MS =
  60 * 60 * 1000

const expensesMemoryCache =
  new Map()

function getCacheKey(
  userId,
  tripId,
) {
  return `${EXPENSES_CACHE_PREFIX}:${userId}:${tripId}`
}

function isCacheEntryValid(
  cacheEntry,
) {
  if (
    !cacheEntry ||
    !Array.isArray(
      cacheEntry.expenses,
    ) ||
    typeof cacheEntry.cachedAt !==
      'number'
  ) {
    return false
  }

  return (
    Date.now() -
      cacheEntry.cachedAt <
    EXPENSES_CACHE_TTL_MS
  )
}

function removeCachedExpensesByKey(
  cacheKey,
) {
  expensesMemoryCache.delete(
    cacheKey,
  )

  try {
    localStorage.removeItem(
      cacheKey,
    )
  } catch {
    // Cache cleanup failure
    // should never break the app.
  }
}

export function getCachedTripExpenses(
  userId,
  tripId,
) {
  if (!userId || !tripId) {
    return null
  }

  const cacheKey = getCacheKey(
    userId,
    tripId,
  )

  const memoryEntry =
    expensesMemoryCache.get(
      cacheKey,
    )

  if (
    isCacheEntryValid(
      memoryEntry,
    )
  ) {
    return memoryEntry.expenses
  }

  if (memoryEntry) {
    expensesMemoryCache.delete(
      cacheKey,
    )
  }

  try {
    const storedValue =
      localStorage.getItem(
        cacheKey,
      )

    if (!storedValue) {
      return null
    }

    const storedEntry =
      JSON.parse(storedValue)

    if (
      !isCacheEntryValid(
        storedEntry,
      )
    ) {
      removeCachedExpensesByKey(
        cacheKey,
      )

      return null
    }

    expensesMemoryCache.set(
      cacheKey,
      storedEntry,
    )

    return storedEntry.expenses
  } catch {
    removeCachedExpensesByKey(
      cacheKey,
    )

    return null
  }
}

export function setCachedTripExpenses(
  userId,
  tripId,
  expenses,
) {
  if (
    !userId ||
    !tripId ||
    !Array.isArray(expenses)
  ) {
    return
  }

  const cacheKey = getCacheKey(
    userId,
    tripId,
  )

  const cacheEntry = {
    expenses,
    cachedAt: Date.now(),
  }

  expensesMemoryCache.set(
    cacheKey,
    cacheEntry,
  )

  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify(cacheEntry),
    )
  } catch {
    // localStorage may be unavailable
    // or full. Memory cache still works.
  }
}

export function clearCachedTripExpenses(
  userId,
  tripId,
) {
  if (!userId || !tripId) {
    return
  }

  removeCachedExpensesByKey(
    getCacheKey(
      userId,
      tripId,
    ),
  )
}