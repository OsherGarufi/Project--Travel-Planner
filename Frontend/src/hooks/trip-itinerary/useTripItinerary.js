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
  getTripItinerary,
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

    addItineraryItem,
    clearItineraryActionError,
  }
}