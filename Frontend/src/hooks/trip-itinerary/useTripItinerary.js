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
  syncExpensesCacheAfterItineraryDelete,
  syncExpensesCacheFromItineraryItem,
} from '../../services/itinerary/itineraryExpenseCacheSync'
import {
  getOrCreateTripItineraryRequest,
  releaseTripItineraryRequest,
} from '../../services/itinerary/itineraryRequestManager'
import {
  applyPendingItineraryScheduleUpdates,
  queueItineraryScheduleSave,
  subscribeToItineraryScheduleSaves,
  supersedeItineraryScheduleSave,
} from '../../services/itinerary/itineraryScheduleSaveManager'
import {
  createTripItineraryItem,
  deleteTripItineraryItem,
  getTripItinerary,
  updateTripItineraryItem,
  updateTripItinerarySchedule,
} from '../../services/itinerary/itineraryService'
import { useAuth } from '../useAuth'
import { useFeedback } from '../useFeedback'

function getScheduleReconciliationKey(
  userId,
  tripId,
  itemId,
) {
  return `${userId}:${tripId}:${itemId}`
}

function applyScheduleReconciliations(
  reconciliations,
  userId,
  tripId,
  items,
) {
  let didApply = false

  const nextItems = items.map(
    (item) => {
      const reconciliationKey =
        getScheduleReconciliationKey(
          userId,
          tripId,
          item.id,
        )

      const reconciledItem =
        reconciliations.get(
          reconciliationKey,
        )

      if (!reconciledItem) {
        return item
      }

      didApply = true

      reconciliations.delete(
        reconciliationKey,
      )

      return reconciledItem
    },
  )

  return {
    items: nextItems,
    didApply,
  }
}

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

  const [
    itineraryActionError,
    setItineraryActionError,
  ] = useState('')

  const [
    isCreatingItineraryItem,
    setIsCreatingItineraryItem,
  ] = useState(false)

  const [
    isUpdatingItineraryItem,
    setIsUpdatingItineraryItem,
  ] = useState(false)

  const [
    isUpdatingItinerarySchedule,
    setIsUpdatingItinerarySchedule,
  ] = useState(false)

  const [
    isDeletingItineraryItem,
    setIsDeletingItineraryItem,
  ] = useState(false)

  const applyItineraryItems = (
    nextItems,
    shouldCache = true,
  ) => {
    itineraryItemsRef.current =
      nextItems

    setItineraryItems(
      nextItems,
    )

    if (
      shouldCache &&
      userId &&
      tripId
    ) {
      setTripItineraryCache(
        userId,
        tripId,
        nextItems,
      )
    }
  }

  const replaceItineraryItem =
    (
      itemId,
      nextItem,
      shouldCache = true,
    ) => {
      const nextItems =
        itineraryItemsRef.current.map(
          (item) =>
            item.id === itemId
              ? nextItem
              : item,
        )

      applyItineraryItems(
        nextItems,
        shouldCache,
      )
    }

  const queueItineraryScheduleUpdate =
    (
      itemId,
      scheduleData,
    ) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        !itemId ||
        loadedContextKey !==
          itineraryContextKey ||
        isUpdatingItineraryItem ||
        isUpdatingItinerarySchedule ||
        isDeletingItineraryItem
      ) {
        return null
      }

      const currentItem =
        itineraryItemsRef.current.find(
          (item) =>
            item.id === itemId,
        ) ?? null

      if (!currentItem) {
        return null
      }

      const optimisticItem = {
        ...currentItem,

        itineraryDate:
          scheduleData.itineraryDate,

        startTime:
          scheduleData.startTime,

        endTime:
          scheduleData.endTime,
      }

      queueItineraryScheduleSave({
        userId,
        tripId,
        itemId,
        confirmedItem:
          currentItem,
        optimisticItem,
      })

      setItineraryActionError('')

      replaceItineraryItem(
        itemId,
        optimisticItem,
        false,
      )

      syncExpensesCacheFromItineraryItem(
        userId,
        tripId,
        optimisticItem,
        currentItem,
        { persist: false },
      )

      return optimisticItem
    }

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
          const errorMessage =
            'Could not save the new activity schedule. The previous schedule was restored.'

          setItineraryActionError(
            errorMessage,
          )

          showError(
            errorMessage,
          )
        }
      },
    )
  }, [
    userId,
    tripId,
    itineraryContextKey,
    showError,
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

  const addItineraryItem =
    async (itemData) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        loadedContextKey !==
          itineraryContextKey ||
        isCreatingItineraryItem
      ) {
        return null
      }

      const authSession =
        captureAuthSession()

      if (!authSession) {
        return null
      }

      try {
        setIsCreatingItineraryItem(
          true,
        )

        setItineraryActionError('')

        const createdItem =
          await createTripItineraryItem(
            tripId,
            itemData,
            idToken,
          )

        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        if (!createdItem?.id) {
          throw new Error(
            'Invalid itinerary item response.',
          )
        }

        const nextItems = [
          ...itineraryItemsRef.current,
          createdItem,
        ]

        applyItineraryItems(
          nextItems,
        )

        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          createdItem,
        )

        return createdItem
      } catch (error) {
        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        console.error(
          'Failed to create itinerary item:',
          error,
        )

        setItineraryActionError(
          'Could not add the itinerary item. Please try again.',
        )

        showError(
          'Could not add the itinerary item. Please try again.',
        )

        return null
      } finally {
        if (
          isAuthSessionCurrent(
            authSession,
          )
        ) {
          setIsCreatingItineraryItem(
            false,
          )
        }
      }
    }

  const updateItineraryItem =
    async (
      itemId,
      itemData,
    ) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        !itemId ||
        loadedContextKey !==
          itineraryContextKey ||
        isUpdatingItineraryItem
      ) {
        return null
      }

      const authSession =
        captureAuthSession()

      if (!authSession) {
        return null
      }

      await supersedeItineraryScheduleSave(
        userId,
        tripId,
        itemId,
      )

      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return null
      }

      const previousItem =
        itineraryItemsRef.current.find(
          (item) =>
            item.id === itemId,
        ) ?? null

      try {
        setIsUpdatingItineraryItem(
          true,
        )

        setItineraryActionError('')

        const updatedItem =
          await updateTripItineraryItem(
            tripId,
            itemId,
            itemData,
            idToken,
          )

        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        if (!updatedItem?.id) {
          throw new Error(
            'Invalid itinerary item response.',
          )
        }

        const nextItems =
          itineraryItemsRef.current.map(
            (item) =>
              item.id === itemId
                ? updatedItem
                : item,
          )

        applyItineraryItems(
          nextItems,
        )

        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          updatedItem,
          previousItem,
        )

        return updatedItem
      } catch (error) {
        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        console.error(
          'Failed to update itinerary item:',
          error,
        )

        setItineraryActionError(
          'Could not update the itinerary item. Please try again.',
        )

        showError(
          'Could not update the itinerary item. Please try again.',
        )

        return null
      } finally {
        if (
          isAuthSessionCurrent(
            authSession,
          )
        ) {
          setIsUpdatingItineraryItem(
            false,
          )
        }
      }
    }

  const updateItinerarySchedule =
    async (
      itemId,
      scheduleData,
    ) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        !itemId ||
        loadedContextKey !==
          itineraryContextKey ||
        isUpdatingItinerarySchedule
      ) {
        return null
      }

      const authSession =
        captureAuthSession()

      if (!authSession) {
        return null
      }

      await supersedeItineraryScheduleSave(
        userId,
        tripId,
        itemId,
      )

      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return null
      }

      const previousItem =
        itineraryItemsRef.current.find(
          (item) =>
            item.id === itemId,
        ) ?? null

      try {
        setIsUpdatingItinerarySchedule(
          true,
        )

        setItineraryActionError('')

        const updatedItem =
          await updateTripItinerarySchedule(
            tripId,
            itemId,
            scheduleData,
            idToken,
          )

        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        if (!updatedItem?.id) {
          throw new Error(
            'Invalid itinerary schedule response.',
          )
        }

        const nextItems =
          itineraryItemsRef.current.map(
            (item) =>
              item.id === itemId
                ? updatedItem
                : item,
          )

        applyItineraryItems(
          nextItems,
        )

        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          updatedItem,
          previousItem,
        )

        return updatedItem
      } catch (error) {
        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        console.error(
          'Failed to update itinerary schedule:',
          error,
        )

        setItineraryActionError(
          'Could not update the activity schedule. Please try again.',
        )

        showError(
          'Could not update the activity schedule. Please try again.',
        )

        return null
      } finally {
        if (
          isAuthSessionCurrent(
            authSession,
          )
        ) {
          setIsUpdatingItinerarySchedule(
            false,
          )
        }
      }
    }

  const deleteItineraryItem =
    async (itemId) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        !itemId ||
        loadedContextKey !==
          itineraryContextKey ||
        isDeletingItineraryItem
      ) {
        return false
      }

      const authSession =
        captureAuthSession()

      if (!authSession) {
        return false
      }

      await supersedeItineraryScheduleSave(
        userId,
        tripId,
        itemId,
      )

      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return false
      }

      const itemToDelete =
        itineraryItemsRef.current.find(
          (item) =>
            item.id === itemId,
        ) ?? null

      try {
        setIsDeletingItineraryItem(
          true,
        )

        setItineraryActionError('')

        await deleteTripItineraryItem(
          tripId,
          itemId,
          idToken,
        )

        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return false
        }

        const nextItems =
          itineraryItemsRef.current.filter(
            (item) =>
              item.id !== itemId,
          )

        applyItineraryItems(
          nextItems,
        )

        if (itemToDelete) {
          syncExpensesCacheAfterItineraryDelete(
            userId,
            tripId,
            itemToDelete,
          )
        }

        return true
      } catch (error) {
        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return false
        }

        console.error(
          'Failed to delete itinerary item:',
          error,
        )

        setItineraryActionError(
          'Could not delete the itinerary item. Please try again.',
        )

        showError(
          'Could not delete the itinerary item. Please try again.',
        )

        return false
      } finally {
        if (
          isAuthSessionCurrent(
            authSession,
          )
        ) {
          setIsDeletingItineraryItem(
            false,
          )
        }
      }
    }

  const clearItineraryActionError =
    () => {
      setItineraryActionError('')
    }

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
    itineraryActionError,

    isCreatingItineraryItem,
    isUpdatingItineraryItem,
    isUpdatingItinerarySchedule,
    isDeletingItineraryItem,

    addItineraryItem,
    updateItineraryItem,
    updateItinerarySchedule,
    queueItineraryScheduleUpdate,
    deleteItineraryItem,

    clearItineraryActionError,
  }
}
