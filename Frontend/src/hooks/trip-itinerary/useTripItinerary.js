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
  createTripItineraryItem,
  deleteTripItineraryItem,
  getTripItinerary,
  updateTripItineraryItem,
  updateTripItinerarySchedule,
} from '../../services/itinerary/itineraryService'
import { useAuth } from '../useAuth'

const ITINERARY_SCHEDULE_SAVE_DELAY_MS =
  5000

export function useTripItinerary(
  tripId,
) {
  const {
    firebaseUser,
    idToken,
  } = useAuth()

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

  const pendingScheduleUpdatesRef =
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
      )
    }

  const applyScheduleItemToCache =
    (
      scheduleEntry,
      item,
      previousItem,
    ) => {
      if (
        !scheduleEntry?.userId ||
        !scheduleEntry?.tripId ||
        !item?.id
      ) {
        return
      }

      const cachedItems =
        getTripItineraryCache(
          scheduleEntry.userId,
          scheduleEntry.tripId,
        )

      if (!cachedItems) {
        return
      }

      const hasItem =
        cachedItems.some(
          (cachedItem) =>
            cachedItem.id ===
            item.id,
        )

      if (!hasItem) {
        return
      }

      const nextItems =
        cachedItems.map(
          (cachedItem) =>
            cachedItem.id ===
            item.id
              ? item
              : cachedItem,
        )

      setTripItineraryCache(
        scheduleEntry.userId,
        scheduleEntry.tripId,
        nextItems,
      )

      syncExpensesCacheFromItineraryItem(
        scheduleEntry.userId,
        scheduleEntry.tripId,
        item,
        previousItem,
      )
    }

  const applyPersistedScheduleItem =
    (
      scheduleEntry,
      item,
    ) => {
      const currentContextKey =
        userId && tripId
          ? `${userId}:${tripId}`
          : null

      const isCurrentContext =
        scheduleEntry.contextKey ===
        currentContextKey

      if (isCurrentContext) {
        const previousItem =
          itineraryItemsRef.current.find(
            (currentItem) =>
              currentItem.id ===
              item.id,
          ) ?? null

        replaceItineraryItem(
          item.id,
          item,
        )

        syncExpensesCacheFromItineraryItem(
          scheduleEntry.userId,
          scheduleEntry.tripId,
          item,
          previousItem,
        )

        return
      }

      applyScheduleItemToCache(
        scheduleEntry,
        item,
        scheduleEntry.optimisticItem,
      )
    }

  const rollbackScheduleItem =
    (
      scheduleEntry,
    ) => {
      const rollbackItem =
        scheduleEntry?.confirmedItem

      if (!rollbackItem?.id) {
        return
      }

      const currentContextKey =
        userId && tripId
          ? `${userId}:${tripId}`
          : null

      const isCurrentContext =
        scheduleEntry.contextKey ===
        currentContextKey

      if (isCurrentContext) {
        const currentItem =
          itineraryItemsRef.current.find(
            (item) =>
              item.id ===
              rollbackItem.id,
          ) ?? null

        replaceItineraryItem(
          rollbackItem.id,
          rollbackItem,
        )

        syncExpensesCacheFromItineraryItem(
          scheduleEntry.userId,
          scheduleEntry.tripId,
          rollbackItem,
          currentItem,
        )

        return
      }

      applyScheduleItemToCache(
        scheduleEntry,
        rollbackItem,
        scheduleEntry.optimisticItem,
      )
    }

  const persistQueuedScheduleUpdate =
    async (
      itemId,
      expectedVersion,
    ) => {
      const scheduleEntry =
        pendingScheduleUpdatesRef
          .current
          .get(itemId)

      if (
        !scheduleEntry ||
        scheduleEntry.cancelled ||
        scheduleEntry.version !==
          expectedVersion
      ) {
        return
      }

      scheduleEntry.timerId =
        null

      if (
        scheduleEntry.requestPromise
      ) {
        scheduleEntry.isDue =
          true

        return
      }

      scheduleEntry.isDue =
        false

      const requestVersion =
        scheduleEntry.version

      const requestSchedule = {
        itineraryDate:
          scheduleEntry
            .optimisticItem
            .itineraryDate,

        startTime:
          scheduleEntry
            .optimisticItem
            .startTime,

        endTime:
          scheduleEntry
            .optimisticItem
            .endTime,
      }

      const requestPromise =
        updateTripItinerarySchedule(
          scheduleEntry.tripId,
          itemId,
          requestSchedule,
          scheduleEntry.idToken,
        )

      scheduleEntry.requestPromise =
        requestPromise

      try {
        const updatedItem =
          await requestPromise

        if (!updatedItem?.id) {
          throw new Error(
            'Invalid itinerary schedule response.',
          )
        }

        const latestEntry =
          pendingScheduleUpdatesRef
            .current
            .get(itemId)

        if (
          !latestEntry ||
          latestEntry.cancelled
        ) {
          return
        }

        latestEntry.requestPromise =
          null

        latestEntry.confirmedItem =
          updatedItem

        if (
          latestEntry.version !==
          requestVersion
        ) {
          if (
            latestEntry.isDue
          ) {
            latestEntry.isDue =
              false

            window.setTimeout(
              () =>
                persistQueuedScheduleUpdate(
                  itemId,
                  latestEntry.version,
                ),
              0,
            )
          }

          return
        }

        pendingScheduleUpdatesRef
          .current
          .delete(itemId)

        applyPersistedScheduleItem(
          latestEntry,
          updatedItem,
        )
      } catch (error) {
        const latestEntry =
          pendingScheduleUpdatesRef
            .current
            .get(itemId)

        if (
          !latestEntry ||
          latestEntry.cancelled
        ) {
          return
        }

        latestEntry.requestPromise =
          null

        if (
          latestEntry.version !==
          requestVersion
        ) {
          if (
            latestEntry.isDue
          ) {
            latestEntry.isDue =
              false

            window.setTimeout(
              () =>
                persistQueuedScheduleUpdate(
                  itemId,
                  latestEntry.version,
                ),
              0,
            )
          }

          return
        }

        console.error(
          'Failed to save dragged itinerary schedule:',
          error,
        )

        pendingScheduleUpdatesRef
          .current
          .delete(itemId)

        rollbackScheduleItem(
          latestEntry,
        )

        setItineraryActionError(
          'Could not save the new activity schedule. The previous schedule was restored.',
        )
      }
    }

  const supersedeQueuedScheduleUpdate =
    async (itemId) => {
      const scheduleEntry =
        pendingScheduleUpdatesRef
          .current
          .get(itemId)

      if (!scheduleEntry) {
        return
      }

      if (
        scheduleEntry.timerId
      ) {
        window.clearTimeout(
          scheduleEntry.timerId,
        )

        scheduleEntry.timerId =
          null
      }

      scheduleEntry.cancelled =
        true

      pendingScheduleUpdatesRef
        .current
        .delete(itemId)

      if (
        scheduleEntry.requestPromise
      ) {
        try {
          await scheduleEntry
            .requestPromise
        } catch {
          // The next explicit mutation
          // will become the source of truth.
        }
      }
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

      const existingEntry =
        pendingScheduleUpdatesRef
          .current
          .get(itemId)

      if (
        existingEntry?.timerId
      ) {
        window.clearTimeout(
          existingEntry.timerId,
        )
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

      const nextVersion =
        (
          existingEntry
            ?.version ?? 0
        ) + 1

      const scheduleEntry = {
        userId,
        tripId,
        idToken,

        contextKey:
          itineraryContextKey,

        version:
          nextVersion,

        confirmedItem:
          existingEntry
            ?.confirmedItem ??
          currentItem,

        optimisticItem,

        requestPromise:
          existingEntry
            ?.requestPromise ??
          null,

        timerId: null,
        isDue: false,
        cancelled: false,
      }

      scheduleEntry.timerId =
        window.setTimeout(
          () =>
            persistQueuedScheduleUpdate(
              itemId,
              nextVersion,
            ),
          ITINERARY_SCHEDULE_SAVE_DELAY_MS,
        )

      pendingScheduleUpdatesRef
        .current
        .set(
          itemId,
          scheduleEntry,
        )

      setItineraryActionError('')

      replaceItineraryItem(
        itemId,
        optimisticItem,
      )

      syncExpensesCacheFromItineraryItem(
        userId,
        tripId,
        optimisticItem,
        currentItem,
      )

      return optimisticItem
    }

  useEffect(() => {
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

      return undefined
    }

    const cachedItems =
      getTripItineraryCache(
        userId,
        tripId,
      )

    if (cachedItems) {
      itineraryItemsRef.current =
        cachedItems

      setItineraryItems(
        cachedItems,
      )

      setItineraryError('')

      setLoadedContextKey(
        itineraryContextKey,
      )

      return undefined
    }

    itineraryItemsRef.current =
      []

    setItineraryItems([])
    setLoadedContextKey(null)
    setItineraryError('')

    let isActive = true

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

    const loadItinerary =
      async () => {
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

          itineraryItemsRef.current =
            loadedItems

          setItineraryItems(
            loadedItems,
          )

          setTripItineraryCache(
            userId,
            tripId,
            loadedItems,
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

        itineraryItemsRef.current =
          nextItems

        setItineraryItems(
          nextItems,
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
        console.error(
          'Failed to create itinerary item:',
          error,
        )

        setItineraryActionError(
          'Could not add the itinerary item. Please try again.',
        )

        return null
      } finally {
        setIsCreatingItineraryItem(
          false,
        )
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

      await supersedeQueuedScheduleUpdate(
        itemId,
      )

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
        console.error(
          'Failed to update itinerary item:',
          error,
        )

        setItineraryActionError(
          'Could not update the itinerary item. Please try again.',
        )

        return null
      } finally {
        setIsUpdatingItineraryItem(
          false,
        )
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

      await supersedeQueuedScheduleUpdate(
        itemId,
      )

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
        console.error(
          'Failed to update itinerary schedule:',
          error,
        )

        setItineraryActionError(
          'Could not update the activity schedule. Please try again.',
        )

        return null
      } finally {
        setIsUpdatingItinerarySchedule(
          false,
        )
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

      await supersedeQueuedScheduleUpdate(
        itemId,
      )

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
        console.error(
          'Failed to delete itinerary item:',
          error,
        )

        setItineraryActionError(
          'Could not delete the itinerary item. Please try again.',
        )

        return false
      } finally {
        setIsDeletingItineraryItem(
          false,
        )
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