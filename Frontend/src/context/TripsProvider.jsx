import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useAuth } from '../hooks/useAuth'
import {
    getTripById,
    getTrips,
} from '../services/tripService'
import { TripsContext } from './TripsContext'

const TRIPS_CACHE_TTL = 3 * 60 * 60 * 1000

const activeTripsRequests = new Map()
const activeTripDetailsRequests = new Map()

function getTripsCacheKey(userId) {
  return `travelPlannerTrips:${userId}`
}

function getTripRequestKey(userId, tripId) {
  return `${userId}:${tripId}`
}

function readTripsCache(userId) {
  if (!userId) {
    return null
  }

  const cacheKey = getTripsCacheKey(userId)

  try {
    const cachedValue =
      window.sessionStorage.getItem(cacheKey)

    if (!cachedValue) {
      return null
    }

    const parsedCache = JSON.parse(cachedValue)

    const isValidCache =
      Array.isArray(parsedCache.trips) &&
      typeof parsedCache.savedAt === 'number' &&
      typeof parsedCache.isComplete === 'boolean'

    if (!isValidCache) {
      window.sessionStorage.removeItem(cacheKey)
      return null
    }

    const isExpired =
      Date.now() - parsedCache.savedAt >
      TRIPS_CACHE_TTL

    if (isExpired) {
      window.sessionStorage.removeItem(cacheKey)
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

    window.sessionStorage.removeItem(cacheKey)

    return null
  }
}

function writeTripsCache(
  userId,
  trips,
  isComplete,
) {
  if (!userId) {
    return
  }

  const cacheKey = getTripsCacheKey(userId)

  try {
    window.sessionStorage.setItem(
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

function removeTripsCache(userId) {
  if (!userId) {
    return
  }

  window.sessionStorage.removeItem(
    getTripsCacheKey(userId),
  )
}

function createInitialTripsState(userId) {
  const cachedTrips = readTripsCache(userId)

  return {
    trips: cachedTrips?.trips ?? [],
    hasLoadedTrips:
      cachedTrips?.isComplete ?? false,
    isLoadingTrips: false,
    tripsError: '',
  }
}

function TripsProviderForUser({
  children,
  userId,
  idToken,
}) {
  const [tripsState, setTripsState] = useState(
    () => createInitialTripsState(userId),
  )

  const tripsRef = useRef(tripsState.trips)
  const hasLoadedTripsRef = useRef(
    tripsState.hasLoadedTrips,
  )
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const applyTrips = useCallback(
    (
      nextTrips,
      isComplete,
      shouldPersist = true,
    ) => {
      tripsRef.current = nextTrips
      hasLoadedTripsRef.current = isComplete

      setTripsState((currentState) => ({
        ...currentState,
        trips: nextTrips,
        hasLoadedTrips: isComplete,
      }))

      if (shouldPersist && userId) {
        writeTripsCache(
          userId,
          nextTrips,
          isComplete,
        )
      }
    },
    [userId],
  )

  const loadTrips = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!userId || !idToken) {
        return []
      }

      if (
        !forceRefresh &&
        hasLoadedTripsRef.current
      ) {
        return tripsRef.current
      }

      setTripsState((currentState) => ({
        ...currentState,
        isLoadingTrips: true,
        tripsError: '',
      }))

      let tripsRequest =
        activeTripsRequests.get(userId)

      if (!tripsRequest) {
        tripsRequest = getTrips(idToken)

        activeTripsRequests.set(
          userId,
          tripsRequest,
        )
      }

      try {
        const tripsResult = await tripsRequest

        const normalizedTrips =
          Array.isArray(tripsResult)
            ? tripsResult
            : []

        if (isMountedRef.current) {
          applyTrips(normalizedTrips, true)
        }

        return normalizedTrips
      } catch (error) {
        if (isMountedRef.current) {
          setTripsState((currentState) => ({
            ...currentState,
            tripsError:
              'Could not load your trips. Please try again.',
          }))
        }

        throw error
      } finally {
        if (
          activeTripsRequests.get(userId) ===
          tripsRequest
        ) {
          activeTripsRequests.delete(userId)
        }

        if (isMountedRef.current) {
          setTripsState((currentState) => ({
            ...currentState,
            isLoadingTrips: false,
          }))
        }
      }
    },
    [applyTrips, idToken, userId],
  )

  const getTripFromCache = useCallback(
    (tripId) =>
      tripsRef.current.find(
        (trip) => trip.id === tripId,
      ) ?? null,
    [],
  )

  const addTripToCache = useCallback(
    (trip) => {
      if (!trip?.id) {
        return
      }

      const nextTrips = [
        trip,
        ...tripsRef.current.filter(
          (existingTrip) =>
            existingTrip.id !== trip.id,
        ),
      ]

      applyTrips(
        nextTrips,
        hasLoadedTripsRef.current,
      )
    },
    [applyTrips],
  )

  const updateTripInCache = useCallback(
    (updatedTrip) => {
      if (!updatedTrip?.id) {
        return
      }

      const tripExists =
        tripsRef.current.some(
          (trip) => trip.id === updatedTrip.id,
        )

      const nextTrips = tripExists
        ? tripsRef.current.map((trip) =>
            trip.id === updatedTrip.id
              ? updatedTrip
              : trip,
          )
        : [updatedTrip, ...tripsRef.current]

      applyTrips(
        nextTrips,
        hasLoadedTripsRef.current,
      )
    },
    [applyTrips],
  )

  const removeTripFromCache = useCallback(
    (tripId) => {
      const nextTrips =
        tripsRef.current.filter(
          (trip) => trip.id !== tripId,
        )

      applyTrips(
        nextTrips,
        hasLoadedTripsRef.current,
      )
    },
    [applyTrips],
  )

  const loadTripById = useCallback(
    async (
      tripId,
      { forceRefresh = false } = {},
    ) => {
      if (!tripId || !userId || !idToken) {
        return null
      }

      if (!forceRefresh) {
        const cachedTrip =
          tripsRef.current.find(
            (trip) => trip.id === tripId,
          )

        if (cachedTrip) {
          return cachedTrip
        }
      }

      const requestKey = getTripRequestKey(
        userId,
        tripId,
      )

      let tripRequest =
        activeTripDetailsRequests.get(requestKey)

      if (!tripRequest) {
        tripRequest = getTripById(
          tripId,
          idToken,
        )

        activeTripDetailsRequests.set(
          requestKey,
          tripRequest,
        )
      }

      try {
        const tripResult = await tripRequest

        if (
          isMountedRef.current &&
          tripResult?.id
        ) {
          updateTripInCache(tripResult)
        }

        return tripResult ?? null
      } finally {
        if (
          activeTripDetailsRequests.get(
            requestKey,
          ) === tripRequest
        ) {
          activeTripDetailsRequests.delete(
            requestKey,
          )
        }
      }
    },
    [
      idToken,
      updateTripInCache,
      userId,
    ],
  )

  const clearTripsCache = useCallback(() => {
    removeTripsCache(userId)

    tripsRef.current = []
    hasLoadedTripsRef.current = false

    setTripsState({
      trips: [],
      hasLoadedTrips: false,
      isLoadingTrips: false,
      tripsError: '',
    })
  }, [userId])

  const contextValue = useMemo(
    () => ({
      trips: tripsState.trips,
      hasLoadedTrips:
        tripsState.hasLoadedTrips,
      isLoadingTrips:
        tripsState.isLoadingTrips,
      tripsError: tripsState.tripsError,
      loadTrips,
      loadTripById,
      getTripFromCache,
      addTripToCache,
      updateTripInCache,
      removeTripFromCache,
      clearTripsCache,
    }),
    [
      tripsState,
      loadTrips,
      loadTripById,
      getTripFromCache,
      addTripToCache,
      updateTripInCache,
      removeTripFromCache,
      clearTripsCache,
    ],
  )

  return (
    <TripsContext.Provider value={contextValue}>
      {children}
    </TripsContext.Provider>
  )
}

export function TripsProvider({ children }) {
  const { firebaseUser, idToken } = useAuth()

  const userId = firebaseUser?.uid ?? null

  const previousUserIdRef = useRef(userId)

  useEffect(() => {
    const previousUserId =
      previousUserIdRef.current

    if (
      previousUserId &&
      previousUserId !== userId
    ) {
      removeTripsCache(previousUserId)
    }

    previousUserIdRef.current = userId
  }, [userId])

  return (
    <TripsProviderForUser
      key={userId ?? 'guest'}
      userId={userId}
      idToken={idToken}
    >
      {children}
    </TripsProviderForUser>
  )
}