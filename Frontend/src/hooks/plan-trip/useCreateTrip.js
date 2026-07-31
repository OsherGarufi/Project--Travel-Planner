import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrip } from '../../services/tripService'
import { useAuth } from '../useAuth'
import { useTrips } from '../useTrips'

export function useCreateTrip({
  selectedCountry,
  selectedCity,
  startDate,
  endDate,
}) {
  const { idToken } = useAuth()
  const { addTripToCache } = useTrips()
  const navigate = useNavigate()

  const [isCreatingTrip, setIsCreatingTrip] =
    useState(false)

  const [createTripError, setCreateTripError] =
    useState('')

  const isCreateTripDisabled =
    !selectedCountry ||
    !selectedCity ||
    !startDate ||
    !endDate ||
    !idToken ||
    isCreatingTrip

  const clearCreateTripError = () => {
    setCreateTripError('')
  }

  const createSelectedTrip = async () => {
    if (isCreateTripDisabled) {
      return
    }

    const tripData = {
      title: `Trip to ${selectedCity.name}`.slice(
        0,
        100,
      ),
      destinationCountryCode:
        selectedCountry.code,
      destinationCountryName:
        selectedCountry.name,
      destinationCity: selectedCity.name,
      startDate,
      endDate,
      budgetAmount: null,
      budgetCurrency: 'ILS',
      notes: null,
    }

    try {
      setIsCreatingTrip(true)
      setCreateTripError('')

      const createdTrip = await createTrip(
        tripData,
        idToken,
      )

      if (!createdTrip?.id) {
        throw new Error(
          'The server did not return the created trip.',
        )
      }

      addTripToCache(createdTrip)

      navigate(`/trips/${createdTrip.id}`)
    } catch (error) {
      console.error(
        'Failed to create trip:',
        error,
      )

      setCreateTripError(
        'Could not create the trip. Please try again.',
      )
    } finally {
      setIsCreatingTrip(false)
    }
  }

  return {
    isCreatingTrip,
    createTripError,
    isCreateTripDisabled,
    clearCreateTripError,
    createSelectedTrip,
  }
}