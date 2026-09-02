import {
  useEffect,
  useState,
} from 'react'
import {
  getOrCreateTripItineraryRequest,
  releaseTripItineraryRequest,
} from '../../services/itinerary/itineraryRequestManager'
import {
  createTripItineraryItem,
  deleteTripItineraryItem,
  getTripItinerary,
  updateTripItineraryItem,
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

  const [
    itineraryItems,
    setItineraryItems,
  ] = useState([])

  const [
    loadedTripId,
    setLoadedTripId,
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
    isDeletingItineraryItem,
    setIsDeletingItineraryItem,
  ] = useState(false)

  useEffect(() => {
    if (
      !tripId ||
      !userId ||
      !idToken
    ) {
      return undefined
    }

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

          setItineraryItems(
            Array.isArray(result)
              ? result
              : [],
          )

          setItineraryError('')
          setLoadedTripId(tripId)
        } catch (error) {
          if (!isActive) {
            return
          }

          console.error(
            'Failed to load trip itinerary:',
            error,
          )

          setItineraryItems([])

          setItineraryError(
            'Could not load the itinerary. Please try again.',
          )

          setLoadedTripId(tripId)
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
  ])

  const addItineraryItem =
    async (itemData) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
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

        setItineraryItems(
          (currentItems) => [
            ...currentItems,
            createdItem,
          ],
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

        setItineraryItems(
          (currentItems) =>
            currentItems.map(
              (item) =>
                item.id === itemId
                  ? updatedItem
                  : item,
            ),
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

  const deleteItineraryItem =
    async (itemId) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        !itemId ||
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

        setItineraryItems(
          (currentItems) =>
            currentItems.filter(
              (item) =>
                item.id !== itemId,
            ),
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

  const isLoadingItinerary =
    Boolean(
      tripId &&
      userId &&
      idToken &&
      loadedTripId !== tripId,
    )

  const visibleItineraryItems =
    loadedTripId === tripId
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
    isDeletingItineraryItem,

    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,

    clearItineraryActionError,
  }
}