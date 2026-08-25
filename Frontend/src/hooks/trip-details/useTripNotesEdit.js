import { useState } from 'react'
import { updateTrip } from '../../services/tripService'
import { buildTripUpdatePayload } from '../../utils/tripUpdateUtils'
import { useAuth } from '../useAuth'
import { useTrips } from '../useTrips'

export function useTripNotesEdit({
  trip,
  replaceTrip,
}) {
  const { idToken } = useAuth()
  const { updateTripInCache } =
    useTrips()

  const [notes, setNotes] =
    useState('')

  const [
    isSavingNotes,
    setIsSavingNotes,
  ] = useState(false)

  const [
    notesSaveError,
    setNotesSaveError,
  ] = useState('')

  const originalNotes =
    trip?.notes || ''

  const startNotesEditing = () => {
    if (!trip) {
      return
    }

    setNotes(originalNotes)
    setNotesSaveError('')
  }

  const cancelNotesEditing = () => {
    setNotes(originalNotes)
    setNotesSaveError('')
  }

  const handleNotesChange = (
    event,
  ) => {
    setNotes(event.target.value)
    setNotesSaveError('')
  }

  const hasNotesChanges =
    Boolean(trip) &&
    notes.trim() !==
      originalNotes.trim()

  const saveNotes = async () => {
    if (
      !trip?.id ||
      !idToken ||
      isSavingNotes ||
      !hasNotesChanges
    ) {
      return false
    }

    const normalizedNotes =
      notes.trim() || null

    const tripData =
      buildTripUpdatePayload(
        trip,
        {
          notes: normalizedNotes,
        },
      )

    try {
      setIsSavingNotes(true)
      setNotesSaveError('')

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

      return true
    } catch (error) {
      console.error(
        'Failed to update trip notes:',
        error,
      )

      setNotesSaveError(
        'Could not save the notes. Please try again.',
      )

      return false
    } finally {
      setIsSavingNotes(false)
    }
  }

  return {
    notes,
    hasNotesChanges,
    isSavingNotes,
    notesSaveError,

    startNotesEditing,
    cancelNotesEditing,
    saveNotes,
    handleNotesChange,
  }
}