import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  getTripItineraryCache,
  setTripItineraryCache,
} from '../../services/itinerary/itineraryCache'
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
    deleteItineraryItem,

    clearItineraryActionError,
  }
}