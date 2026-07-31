import {
    useCallback,
    useEffect,
    useState,
} from 'react'
import { useParams } from 'react-router-dom'
import { useTrips } from '../useTrips'

export function useTripDetails() {
  const { tripId } = useParams()
  const { loadTripById } = useTrips()

  const hasTripId = Boolean(tripId)

  const [trip, setTrip] = useState(null)

  const [isLoadingTrip, setIsLoadingTrip] =
    useState(hasTripId)

  const [tripError, setTripError] = useState(
    hasTripId ? '' : 'Trip not found.',
  )

  useEffect(() => {
    if (!tripId) {
      return undefined
    }

    let isActive = true

    const loadTrip = async () => {
      try {
        setIsLoadingTrip(true)
        setTripError('')

        const tripResult =
          await loadTripById(tripId)

        if (!isActive) {
          return
        }

        if (!tripResult) {
          setTrip(null)
          setTripError('Trip not found.')
          return
        }

        setTrip(tripResult)
      } catch (error) {
        if (!isActive) {
          return
        }

        console.error(
          'Failed to load trip details:',
          error,
        )

        setTrip(null)

        setTripError(
          'Could not load this trip. Please try again.',
        )
      } finally {
        if (isActive) {
          setIsLoadingTrip(false)
        }
      }
    }

    loadTrip()

    return () => {
      isActive = false
    }
  }, [loadTripById, tripId])

  const replaceTrip = useCallback(
    (updatedTrip) => {
      setTrip(updatedTrip)
    },
    [],
  )

  return {
    trip,
    tripId,
    isLoadingTrip,
    tripError,
    replaceTrip,
  }
}