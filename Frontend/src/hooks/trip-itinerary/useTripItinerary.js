import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  getTripItineraryCache,
  getTripItineraryCacheKey,
  ITINERARY_CACHE_UPDATED_EVENT,
  setTripItineraryCache,
} from '../../services/itinerary/itineraryCache'
import {
  getOrCreateTripItineraryRequest,
  releaseTripItineraryRequest,
} from '../../services/itinerary/itineraryRequestManager'
import {
  applyPendingItineraryScheduleUpdates,
  subscribeToItineraryScheduleSaves,
} from '../../services/itinerary/itineraryScheduleSaveManager'
import { getTripItinerary } from '../../services/itinerary/itineraryService'
import { useAuth } from '../useAuth'
import { useFeedback } from '../useFeedback'
import {
  applyScheduleReconciliations,
  getScheduleReconciliationKey,
} from './itineraryReconciliation'
import { useItineraryMutations } from './useItineraryMutations'

export function useTripItinerary(
  tripId,
) {
  const {
    firebaseUser,
    idToken,
    captureAuthSession,
    isAuthSessionCurrent,
  } = useAuth()

  const { showError } =
    useFeedback()

  const userId =
    firebaseUser?.uid ?? null

  const itineraryContextKey =
    userId && tripId
      ? `${userId}:${tripId}`
      : null

  const [
    itineraryItems,
    setItineraryItems,
  ] = useState([])

  const itineraryItemsRef =
    useRef([])

  const scheduleReconciliationsRef =
    useRef(new Map())

  const [
    loadedContextKey,
    setLoadedContextKey,
  ] = useState(null)

  const [
    itineraryError,
    setItineraryError,
  ] = useState('')

  const applyConfirmedItineraryItems = (
    nextItems,
  ) => {
    itineraryItemsRef.current =
      nextItems

    setItineraryItems(
      nextItems,
    )

    if (userId && tripId) {
      setTripItineraryCache(
        userId,
        tripId,
        nextItems,
      )
    }
  }

  const applyOptimisticItineraryItems = (
    nextItems,
  ) => {
    itineraryItemsRef.current =
      nextItems

    setItineraryItems(nextItems)
  }

  const mutations = useItineraryMutations({
    tripId,
    userId,
    idToken,
    itineraryContextKey,
    loadedContextKey,
    itineraryItemsRef,
    applyConfirmedItineraryItems,
    applyOptimisticItineraryItems,
    captureAuthSession,
    isAuthSessionCurrent,
    showError,
  })

  const {
    reportScheduleSaveFailure,
  } = mutations

  useEffect(() => {
    if (
      !userId ||
      !tripId ||
      !itineraryContextKey
    ) {
      return undefined
    }

    return subscribeToItineraryScheduleSaves(
      (result) => {
        if (
          result.userId !== userId ||
          result.tripId !== tripId ||
          !result.item?.id
        ) {
          return
        }

        const reconciliationKey =
          getScheduleReconciliationKey(
            result.userId,
            result.tripId,
            result.item.id,
          )

        scheduleReconciliationsRef
          .current
          .set(
            reconciliationKey,
            result.item,
          )

        const reconciliation =
          applyScheduleReconciliations(
            scheduleReconciliationsRef.current,
            userId,
            tripId,
            itineraryItemsRef.current,
          )

        reconciliation.consumedKeys.forEach(
          (key) =>
            scheduleReconciliationsRef.current.delete(
              key,
            ),
        )

        if (reconciliation.didApply) {
          itineraryItemsRef.current =
            reconciliation.items

          setItineraryItems(
            reconciliation.items,
          )
        }

        if (
          result.status ===
          'failed'
        ) {
          reportScheduleSaveFailure()
        }
      },
    )
  }, [
    userId,
    tripId,
    itineraryContextKey,
    reportScheduleSaveFailure,
  ])

  useEffect(() => {
    let isActive = true

    const loadItinerary =
      async () => {
        await Promise.resolve()

        if (!isActive) {
          return
        }

        if (
          !tripId ||
          !userId ||
          !idToken ||
          !itineraryContextKey
        ) {
          itineraryItemsRef.current =
            []

          setItineraryItems([])
          setLoadedContextKey(null)
          setItineraryError('')

          return
        }

        const cachedItems =
          getTripItineraryCache(
            userId,
            tripId,
          )

        if (cachedItems) {
          const reconciliation =
            applyScheduleReconciliations(
              scheduleReconciliationsRef.current,
              userId,
              tripId,
              cachedItems,
            )

          reconciliation.consumedKeys.forEach(
            (key) =>
              scheduleReconciliationsRef.current.delete(
                key,
              ),
          )

          const visibleItems =
            applyPendingItineraryScheduleUpdates(
              userId,
              tripId,
              reconciliation.items,
            )

          if (reconciliation.didApply) {
            setTripItineraryCache(
              userId,
              tripId,
              reconciliation.items,
            )
          }

          itineraryItemsRef.current =
            visibleItems

          setItineraryItems(
            visibleItems,
          )

          setItineraryError('')

          setLoadedContextKey(
            itineraryContextKey,
          )

          return
        }

        itineraryItemsRef.current =
          []

        setItineraryItems([])
        setLoadedContextKey(null)
        setItineraryError('')

        const itineraryRequest =
          getOrCreateTripItineraryRequest(
            userId,
            tripId,
            () =>
              getTripItinerary(
                tripId,
                idToken,
              ),
          )

        try {
          const result =
            await itineraryRequest

          if (!isActive) {
            return
          }

          const loadedItems =
            Array.isArray(result)
              ? result
              : []

          const reconciliation =
            applyScheduleReconciliations(
              scheduleReconciliationsRef.current,
              userId,
              tripId,
              loadedItems,
            )

          reconciliation.consumedKeys.forEach(
            (key) =>
              scheduleReconciliationsRef.current.delete(
                key,
              ),
          )

          const visibleItems =
            applyPendingItineraryScheduleUpdates(
              userId,
              tripId,
              reconciliation.items,
            )

          itineraryItemsRef.current =
            visibleItems

          setItineraryItems(
            visibleItems,
          )

          setTripItineraryCache(
            userId,
            tripId,
            reconciliation.items,
          )

          setItineraryError('')

          setLoadedContextKey(
            itineraryContextKey,
          )
        } catch (error) {
          if (!isActive) {
            return
          }

          console.error(
            'Failed to load trip itinerary:',
            error,
          )

          itineraryItemsRef.current =
            []

          setItineraryItems([])

          setItineraryError(
            'Could not load the itinerary. Please try again.',
          )

          setLoadedContextKey(
            itineraryContextKey,
          )
        } finally {
          releaseTripItineraryRequest(
            userId,
            tripId,
            itineraryRequest,
          )
        }
      }

    loadItinerary()

    return () => {
      isActive = false
    }
  }, [
    tripId,
    userId,
    idToken,
    itineraryContextKey,
  ])

  useEffect(() => {
    if (
      !userId ||
      !tripId ||
      !itineraryContextKey ||
      loadedContextKey !==
        itineraryContextKey
    ) {
      return undefined
    }

    const cacheKey =
      getTripItineraryCacheKey(
        userId,
        tripId,
      )

    const applyCachedItems =
      () => {
        const nextItems =
          getTripItineraryCache(
            userId,
            tripId,
          )

        if (
          !Array.isArray(
            nextItems,
          )
        ) {
          return
        }

        const reconciliation =
          applyScheduleReconciliations(
            scheduleReconciliationsRef.current,
            userId,
            tripId,
            nextItems,
          )

        reconciliation.consumedKeys.forEach(
          (key) =>
            scheduleReconciliationsRef.current.delete(
              key,
            ),
        )

        const visibleItems =
          applyPendingItineraryScheduleUpdates(
            userId,
            tripId,
            reconciliation.items,
          )

        if (reconciliation.didApply) {
          setTripItineraryCache(
            userId,
            tripId,
            reconciliation.items,
          )
        }

        itineraryItemsRef.current =
          visibleItems

        setItineraryItems(
          visibleItems,
        )

        setItineraryError('')
      }

    const handleStorageChange = (
      event,
    ) => {
      if (
        event.storageArea !==
          localStorage ||
        event.key !== cacheKey ||
        !event.newValue
      ) {
        return
      }

      applyCachedItems()
    }

    const handleLocalCacheUpdate = (
      event,
    ) => {
      if (
        event.detail?.userId !==
          userId ||
        event.detail?.tripId !==
          tripId
      ) {
        return
      }

      applyCachedItems()
    }

    window.addEventListener(
      'storage',
      handleStorageChange,
    )

    window.addEventListener(
      ITINERARY_CACHE_UPDATED_EVENT,
      handleLocalCacheUpdate,
    )

    return () => {
      window.removeEventListener(
        'storage',
        handleStorageChange,
      )

      window.removeEventListener(
        ITINERARY_CACHE_UPDATED_EVENT,
        handleLocalCacheUpdate,
      )
    }
  }, [
    userId,
    tripId,
    itineraryContextKey,
    loadedContextKey,
  ])

  const hasItineraryContext =
    Boolean(
      tripId &&
      userId &&
      idToken &&
      itineraryContextKey,
    )

  const isLoadingItinerary =
    Boolean(
      hasItineraryContext &&
      loadedContextKey !==
        itineraryContextKey,
    )

  const visibleItineraryItems =
    hasItineraryContext &&
    loadedContextKey ===
      itineraryContextKey
      ? itineraryItems
      : []

  return {
    itineraryItems:
      visibleItineraryItems,

    isLoadingItinerary,
    itineraryError,
    itineraryActionError:
      mutations.itineraryActionError,

    isCreatingItineraryItem:
      mutations.isCreatingItineraryItem,
    isUpdatingItineraryItem:
      mutations.isUpdatingItineraryItem,
    isUpdatingItinerarySchedule:
      mutations.isUpdatingItinerarySchedule,
    isDeletingItineraryItem:
      mutations.isDeletingItineraryItem,

    addItineraryItem:
      mutations.addItineraryItem,
    updateItineraryItem:
      mutations.updateItineraryItem,
    updateItinerarySchedule:
      mutations.updateItinerarySchedule,
    queueItineraryScheduleUpdate:
      mutations.queueItineraryScheduleUpdate,
    deleteItineraryItem:
      mutations.deleteItineraryItem,

    clearItineraryActionError:
      mutations.clearItineraryActionError,
  }
}
