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
import {
  readTripsCache,
  removeTripsCache,
  writeTripsCache,
} from '../services/trips/tripsCache'
import {
  getOrCreateTripDetailsRequest,
  getOrCreateTripsRequest,
  releaseTripDetailsRequest,
  releaseTripsRequest,
} from '../services/trips/tripsRequestManager'
import { TripsContext } from './TripsContext'

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

      const tripsRequest =
        getOrCreateTripsRequest(
          userId,
          () => getTrips(idToken),
        )

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
        releaseTripsRequest(
          userId,
          tripsRequest,
        )

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

      const tripRequest =
        getOrCreateTripDetailsRequest(
          userId,
          tripId,
          () =>
            getTripById(
              tripId,
              idToken,
            ),
        )

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
        releaseTripDetailsRequest(
          userId,
          tripId,
          tripRequest,
        )
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