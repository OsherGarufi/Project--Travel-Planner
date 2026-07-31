import { useState } from 'react'
import { updateTrip } from '../../services/tripService'
import { useAuth } from '../useAuth'
import { useTrips } from '../useTrips'

export function useTripEdit({
  trip,
  replaceTrip,
}) {
  const { idToken } = useAuth()
  const { updateTripInCache } = useTrips()

  const [isEditing, setIsEditing] = useState(false)

  const [title, setTitle] = useState('')
  const [budgetAmount, setBudgetAmount] =
    useState('')
  const [budgetCurrency, setBudgetCurrency] =
    useState('ILS')
  const [notes, setNotes] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const fillEditForm = (tripDetails) => {
    setTitle(tripDetails.title)

    setBudgetAmount(
      tripDetails.budgetAmount?.toString() ?? '',
    )

    setBudgetCurrency(
      tripDetails.budgetCurrency || 'ILS',
    )

    setNotes(tripDetails.notes || '')
  }

  const startEditing = () => {
    if (!trip) {
      return
    }

    fillEditForm(trip)
    setSaveError('')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (trip) {
      fillEditForm(trip)
    }

    setSaveError('')
    setIsEditing(false)
  }

  const handleTitleChange = (event) => {
    setTitle(event.target.value)
    setSaveError('')
  }

  const handleBudgetAmountChange = (event) => {
    setBudgetAmount(event.target.value)
    setSaveError('')
  }

  const handleBudgetCurrencyChange = (event) => {
    setBudgetCurrency(
      event.target.value.toUpperCase(),
    )

    setSaveError('')
  }

  const handleNotesChange = (event) => {
    setNotes(event.target.value)
    setSaveError('')
  }

  const validateTripDetails = () => {
    const normalizedTitle = title.trim()

    const normalizedCurrency =
      budgetCurrency.trim().toUpperCase()

    if (!normalizedTitle) {
      return {
        error: 'Trip title is required.',
      }
    }

    if (normalizedCurrency.length !== 3) {
      return {
        error:
          'Currency must contain exactly 3 characters.',
      }
    }

    const normalizedBudgetAmount =
      budgetAmount === ''
        ? null
        : Number(budgetAmount)

    if (
      normalizedBudgetAmount !== null &&
      (!Number.isFinite(normalizedBudgetAmount) ||
        normalizedBudgetAmount < 0)
    ) {
      return {
        error:
          'Budget must be a valid non-negative number.',
      }
    }

    return {
      error: '',
      values: {
        title: normalizedTitle,
        budgetAmount: normalizedBudgetAmount,
        budgetCurrency: normalizedCurrency,
        notes: notes.trim() || null,
      },
    }
  }

  const saveTrip = async () => {
    if (!trip?.id || !idToken || isSaving) {
      return
    }

    const validationResult =
      validateTripDetails()

    if (validationResult.error) {
      setSaveError(validationResult.error)
      return
    }

    const tripData = {
      title: validationResult.values.title,
      destinationCountryCode:
        trip.destinationCountryCode,
      destinationCountryName:
        trip.destinationCountryName,
      destinationCity: trip.destinationCity,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budgetAmount:
        validationResult.values.budgetAmount,
      budgetCurrency:
        validationResult.values.budgetCurrency,
      notes: validationResult.values.notes,
    }

    try {
      setIsSaving(true)
      setSaveError('')

      const updateResult = await updateTrip(
        trip.id,
        tripData,
        idToken,
      )

      const updatedTrip = updateResult?.id
        ? updateResult
        : {
            ...trip,
            ...tripData,
          }

      replaceTrip(updatedTrip)
      updateTripInCache(updatedTrip)
      setIsEditing(false)
    } catch (error) {
      console.error(
        'Failed to update trip:',
        error,
      )

      setSaveError(
        'Could not save the changes. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return {
    isEditing,
    title,
    budgetAmount,
    budgetCurrency,
    notes,
    isSaving,
    saveError,
    startEditing,
    cancelEditing,
    saveTrip,
    handleTitleChange,
    handleBudgetAmountChange,
    handleBudgetCurrencyChange,
    handleNotesChange,
  }
}