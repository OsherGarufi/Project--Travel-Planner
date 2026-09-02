import { useState } from 'react'
import {
  updateTripItineraryCacheForDateRange,
} from '../../services/itinerary/itineraryCache'
import { updateTrip } from '../../services/tripService'
import { buildTripUpdatePayload } from '../../utils/tripUpdateUtils'
import { useAuth } from '../useAuth'
import { useTrips } from '../useTrips'

function normalizeCurrencyInput(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
}

function normalizeDateInputValue(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.slice(0, 10)
}

function getTodayDateInputValue() {
  const today = new Date()

  const year = today.getFullYear()

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    today.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function useTripEdit({
  trip,
  replaceTrip,
}) {
  const {
    firebaseUser,
    idToken,
  } = useAuth()

  const {
    updateTripInCache,
  } = useTrips()

  const userId =
    firebaseUser?.uid ?? null

  const [title, setTitle] = useState('')

  const [startDate, setStartDate] =
    useState('')

  const [endDate, setEndDate] =
    useState('')

  const [
    budgetAmount,
    setBudgetAmount,
  ] = useState('')

  const [
    budgetCurrency,
    setBudgetCurrency,
  ] = useState('ILS')

  const [isSaving, setIsSaving] =
    useState(false)

  const [saveError, setSaveError] =
    useState('')

  const minimumTravelDate =
    getTodayDateInputValue()

  const originalStartDate =
    normalizeDateInputValue(
      trip?.startDate,
    )

  const originalEndDate =
    normalizeDateInputValue(
      trip?.endDate,
    )

  const startDateMinimum =
    originalStartDate &&
    originalStartDate < minimumTravelDate
      ? originalStartDate
      : minimumTravelDate

  const endDateMinimum =
    startDate &&
    startDate >= minimumTravelDate
      ? startDate
      : originalEndDate &&
          originalEndDate <
            minimumTravelDate
        ? originalEndDate
        : minimumTravelDate

  const fillEditForm = (
    tripDetails,
  ) => {
    setTitle(tripDetails.title)

    setStartDate(
      normalizeDateInputValue(
        tripDetails.startDate,
      ),
    )

    setEndDate(
      normalizeDateInputValue(
        tripDetails.endDate,
      ),
    )

    setBudgetAmount(
      tripDetails.budgetAmount
        ?.toString() ?? '',
    )

    setBudgetCurrency(
      normalizeCurrencyInput(
        tripDetails.budgetCurrency ||
          'ILS',
      ),
    )
  }

  const startEditing = () => {
    if (!trip) {
      return
    }

    fillEditForm(trip)
    setSaveError('')
  }

  const cancelEditing = () => {
    if (trip) {
      fillEditForm(trip)
    }

    setSaveError('')
  }

  const handleTitleChange = (
    event,
  ) => {
    setTitle(event.target.value)
    setSaveError('')
  }

  const handleStartDateChange = (
    event,
  ) => {
    const nextStartDate =
      event.target.value

    if (
      nextStartDate &&
      nextStartDate !==
        originalStartDate &&
      nextStartDate <
        minimumTravelDate
    ) {
      setSaveError(
        'Start date cannot be before today.',
      )

      return
    }

    setStartDate(nextStartDate)
    setSaveError('')

    if (
      endDate &&
      nextStartDate &&
      endDate < nextStartDate
    ) {
      setEndDate('')
    }
  }

  const handleEndDateChange = (
    event,
  ) => {
    const nextEndDate =
      event.target.value

    if (
      nextEndDate &&
      nextEndDate !==
        originalEndDate &&
      nextEndDate <
        minimumTravelDate
    ) {
      setSaveError(
        'End date cannot be before today.',
      )

      return
    }

    if (
      nextEndDate &&
      startDate &&
      nextEndDate < startDate
    ) {
      setSaveError(
        'End date cannot be before the start date.',
      )

      return
    }

    setEndDate(nextEndDate)
    setSaveError('')
  }

  const handleBudgetAmountChange = (
    event,
  ) => {
    setBudgetAmount(
      event.target.value,
    )

    setSaveError('')
  }

  const handleBudgetCurrencyChange = (
    value,
  ) => {
    setBudgetCurrency(
      normalizeCurrencyInput(value),
    )

    setSaveError('')
  }

  const hasDateChanges =
    Boolean(trip) &&
    (
      startDate !==
        originalStartDate ||
      endDate !== originalEndDate
    )

  const hasChanges =
    Boolean(trip) &&
    (
      title.trim() !==
        (trip.title || '').trim() ||

      hasDateChanges ||

      Number(budgetAmount) !==
        Number(
          trip.budgetAmount,
        ) ||

      budgetCurrency !==
        normalizeCurrencyInput(
          trip.budgetCurrency ||
            'ILS',
        )
    )

  const validateTripDetails = () => {
    const normalizedTitle =
      title.trim()

    const normalizedCurrency =
      normalizeCurrencyInput(
        budgetCurrency,
      )

    if (!normalizedTitle) {
      return {
        error:
          'Trip title is required.',
      }
    }

    if (!startDate || !endDate) {
      return {
        error:
          'Start date and end date are required.',
      }
    }

    if (
      startDate !==
        originalStartDate &&
      startDate <
        minimumTravelDate
    ) {
      return {
        error:
          'Start date cannot be before today.',
      }
    }

    if (
      endDate !== originalEndDate &&
      endDate < minimumTravelDate
    ) {
      return {
        error:
          'End date cannot be before today.',
      }
    }

    if (endDate < startDate) {
      return {
        error:
          'End date cannot be before the start date.',
      }
    }

    const normalizedBudgetAmount =
      Number(budgetAmount)

    if (
      !Number.isFinite(
        normalizedBudgetAmount,
      ) ||
      normalizedBudgetAmount <= 0
    ) {
      return {
        error:
          'Budget must be a valid amount greater than zero.',
      }
    }

    if (
      !/^[A-Z]{3}$/.test(
        normalizedCurrency,
      )
    ) {
      return {
        error:
          'Currency must be a valid 3-letter code.',
      }
    }

    return {
      error: '',
      values: {
        title: normalizedTitle,
        startDate,
        endDate,
        budgetAmount:
          normalizedBudgetAmount,
        budgetCurrency:
          normalizedCurrency,
      },
    }
  }

  const saveTrip = async () => {
    if (
      !trip?.id ||
      !idToken ||
      isSaving ||
      !hasChanges
    ) {
      return false
    }

    const validationResult =
      validateTripDetails()

    if (
      validationResult.error
    ) {
      setSaveError(
        validationResult.error,
      )

      return false
    }

    const shouldUpdateItineraryCache =
      hasDateChanges

    const tripData =
      buildTripUpdatePayload(
        trip,
        {
          title:
            validationResult.values
              .title,

          startDate:
            validationResult.values
              .startDate,

          endDate:
            validationResult.values
              .endDate,

          budgetAmount:
            validationResult.values
              .budgetAmount,

          budgetCurrency:
            validationResult.values
              .budgetCurrency,
        },
      )

    try {
      setIsSaving(true)
      setSaveError('')

      const updateResult =
        await updateTrip(
          trip.id,
          tripData,
          idToken,
        )

      const updatedTrip =
        updateResult?.id
          ? updateResult
          : {
              ...trip,
              ...tripData,
            }

      replaceTrip(updatedTrip)

      updateTripInCache(
        updatedTrip,
      )

      if (
        shouldUpdateItineraryCache &&
        userId
      ) {
        updateTripItineraryCacheForDateRange(
          userId,
          trip.id,
          normalizeDateInputValue(
            updatedTrip.startDate,
          ),
          normalizeDateInputValue(
            updatedTrip.endDate,
          ),
        )
      }

      return true
    } catch (error) {
      console.error(
        'Failed to update trip:',
        error,
      )

      setSaveError(
        'Could not save the changes. Please try again.',
      )

      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    hasChanges,
    hasDateChanges,

    title,
    startDate,
    endDate,
    startDateMinimum,
    endDateMinimum,

    budgetAmount,
    budgetCurrency,

    isSaving,
    saveError,

    startEditing,
    cancelEditing,
    saveTrip,

    handleTitleChange,
    handleStartDateChange,
    handleEndDateChange,
    handleBudgetAmountChange,
    handleBudgetCurrencyChange,
  }
}