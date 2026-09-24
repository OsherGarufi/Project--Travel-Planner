import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrip } from '../../services/tripService'
import { useAuth } from '../useAuth'
import { useFeedback } from '../useFeedback'
import { useTrips } from '../useTrips'

export function useCreateTrip({
  selectedCountry,
  selectedCity,
  startDate,
  endDate,
  budgetAmount,
  budgetCurrency,
}) {
  const {
    idToken,
    captureAuthSession,
    isAuthSessionCurrent,
  } = useAuth()
  const { showSuccess, showError } =
    useFeedback()
  const { addTripToCache } = useTrips()
  const navigate = useNavigate()

  const [isCreatingTrip, setIsCreatingTrip] =
    useState(false)

  const [createTripError, setCreateTripError] =
    useState('')

  const [tripTitle, setTripTitle] =
    useState('')

  const normalizedTripTitle =
    tripTitle.trim()

  const hasValidBudget =
    typeof budgetAmount === 'number' &&
    Number.isFinite(budgetAmount) &&
    budgetAmount > 0

  const hasValidBudgetCurrency =
    typeof budgetCurrency === 'string' &&
    /^[A-Z]{3}$/.test(budgetCurrency)

  const isCreateTripDisabled =
    !normalizedTripTitle ||
    !selectedCountry ||
    !selectedCity ||
    !startDate ||
    !endDate ||
    !hasValidBudget ||
    !hasValidBudgetCurrency ||
    !idToken ||
    isCreatingTrip

  const clearCreateTripError = () => {
    setCreateTripError('')
  }

  const handleTripTitleChange = (
    event,
  ) => {
    setTripTitle(event.target.value)
    setCreateTripError('')
  }

  const createSelectedTrip = async () => {
    if (isCreateTripDisabled) {
      return
    }

    const authSession =
      captureAuthSession()

    if (!authSession) {
      return
    }

    const tripData = {
      title: normalizedTripTitle,
      destinationCountryCode:
        selectedCountry.code,
      destinationCountryName:
        selectedCountry.name,
      destinationCity: selectedCity.name,
      startDate,
      endDate,
      budgetAmount,
      budgetCurrency,
      notes: null,
    }

    try {
      setIsCreatingTrip(true)
      setCreateTripError('')

      const createdTrip = await createTrip(
        tripData,
        idToken,
      )

      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return
      }

      if (!createdTrip?.id) {
        throw new Error(
          'The server did not return the created trip.',
        )
      }

      addTripToCache(createdTrip)

      showSuccess('Trip created successfully.')

      navigate(`/trips/${createdTrip.id}`)
    } catch (error) {
      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return
      }

      console.error(
        'Failed to create trip:',
        error,
      )

      setCreateTripError(
        'Could not create the trip. Please try again.',
      )

      showError(
        'Could not create the trip. Please try again.',
      )
    } finally {
      if (
        isAuthSessionCurrent(
          authSession,
        )
      ) {
        setIsCreatingTrip(false)
      }
    }
  }

  return {
    tripTitle,
    isCreatingTrip,
    createTripError,
    isCreateTripDisabled,
    clearCreateTripError,
    handleTripTitleChange,
    createSelectedTrip,
  }
}
