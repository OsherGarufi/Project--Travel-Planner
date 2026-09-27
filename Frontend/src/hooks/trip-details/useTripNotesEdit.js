import { useState } from 'react'
import {
  organizeTripNotes,
  updateTrip,
} from '../../services/tripService'
import { buildTripUpdatePayload } from '../../utils/tripUpdateUtils'
import { useAuth } from '../useAuth'
import { useFeedback } from '../useFeedback'
import { useTrips } from '../useTrips'

const NOTES_MAXIMUM_LENGTH = 10000

export function useTripNotesEdit({ trip, replaceTrip }) {
  const {
    idToken,
    captureAuthSession,
    isAuthSessionCurrent,
  } = useAuth()
  const { showSuccess, showError } = useFeedback()
  const { updateTripInCache } = useTrips()

  const [draftNote, setDraftNote] = useState('')
  const [preAiDraft, setPreAiDraft] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [notesMode, setNotesMode] = useState('view')
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [organizeError, setOrganizeError] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesSaveError, setNotesSaveError] = useState('')

  const savedNote = trip?.notes || ''

  const clearAiState = () => {
    setPreAiDraft(null)
    setAiResult(null)
    setOrganizeError('')
    setIsOrganizing(false)
  }

  const startNotesView = () => {
    if (!trip) return
    setDraftNote(savedNote)
    setNotesMode('view')
    setNotesSaveError('')
    clearAiState()
  }

  const startNotesEditing = () => {
    if (!trip) return
    setDraftNote(savedNote)
    setNotesMode('edit')
    setNotesSaveError('')
    clearAiState()
  }

  const editNotes = () => {
    setDraftNote(savedNote)
    setNotesMode('edit')
    setNotesSaveError('')
    clearAiState()
  }

  const cancelNotesEditing = () => {
    setDraftNote(savedNote)
    setNotesMode(savedNote.trim() ? 'view' : 'edit')
    setNotesSaveError('')
    clearAiState()
  }

  const closeNotesView = () => {
    setDraftNote(savedNote)
    setNotesMode('view')
    setNotesSaveError('')
    clearAiState()
  }

  const handleNotesChange = (event) => {
    setDraftNote(event.target.value)
    setNotesSaveError('')
    setOrganizeError('')
  }

  const hasNotesChanges =
    Boolean(trip) && draftNote.trim() !== savedNote.trim()

  const canOrganize =
    draftNote.trim().length > 0 &&
    draftNote.length <= NOTES_MAXIMUM_LENGTH &&
    !isOrganizing &&
    !isSavingNotes

  const organizeNotes = async () => {
    if (!trip?.id || !idToken || !canOrganize) return

    const snapshot = draftNote
    const authSession = captureAuthSession()
    if (!authSession) return

    try {
      setPreAiDraft(snapshot)
      setAiResult(null)
      setOrganizeError('')
      setIsOrganizing(true)

      const result = await organizeTripNotes(
        trip.id,
        snapshot,
        idToken,
      )

      if (!isAuthSessionCurrent(authSession)) return

      const organizedNotes =
        typeof result?.organizedNotes === 'string'
          ? result.organizedNotes.trim()
          : ''

      if (
        !organizedNotes ||
        organizedNotes.length > NOTES_MAXIMUM_LENGTH
      ) {
        throw new Error('Invalid organized notes response.')
      }

      setAiResult(organizedNotes)
      setNotesMode('preview')
    } catch (error) {
      if (!isAuthSessionCurrent(authSession)) return

      console.error('Failed to organize trip notes:', error)
      setAiResult(null)
      setPreAiDraft(null)
      setOrganizeError(
        'Could not organize the notes. You can keep editing and try again.',
      )
    } finally {
      if (isAuthSessionCurrent(authSession)) {
        setIsOrganizing(false)
      }
    }
  }

  const applyAiResult = () => {
    if (!aiResult) return
    setDraftNote(aiResult)
    setAiResult(null)
    setNotesMode('edit')
    setOrganizeError('')
  }

  const restorePreAiDraft = () => {
    if (preAiDraft === null) return
    setDraftNote(preAiDraft)
    setPreAiDraft(null)
    setAiResult(null)
    setNotesMode('edit')
    setOrganizeError('')
  }

  const saveNotes = async () => {
    if (
      !trip?.id ||
      !idToken ||
      isSavingNotes ||
      isOrganizing ||
      !hasNotesChanges
    ) {
      return false
    }

    const authSession = captureAuthSession()
    if (!authSession) return false

    const tripData = buildTripUpdatePayload(trip, {
      notes: draftNote.trim() || null,
    })

    try {
      setIsSavingNotes(true)
      setNotesSaveError('')

      const updateResult = await updateTrip(
        trip.id,
        tripData,
        idToken,
      )

      if (!isAuthSessionCurrent(authSession)) return false

      if (!updateResult?.id) {
        throw new Error('Trip update did not return a valid trip.')
      }

      replaceTrip(updateResult)
      updateTripInCache(updateResult)
      clearAiState()
      showSuccess('Trip notes updated.')
      return true
    } catch (error) {
      if (!isAuthSessionCurrent(authSession)) return false

      console.error('Failed to update trip notes:', error)
      setNotesSaveError(
        'Could not save the notes. Please try again.',
      )
      showError(
        'Could not update the trip notes. Please try again.',
      )
      return false
    } finally {
      if (isAuthSessionCurrent(authSession)) {
        setIsSavingNotes(false)
      }
    }
  }

  return {
    savedNote,
    draftNote,
    preAiDraft,
    aiResult,
    notesMode,
    hasNotesChanges,
    canOrganize,
    isOrganizing,
    organizeError,
    isSavingNotes,
    notesSaveError,
    startNotesView,
    startNotesEditing,
    editNotes,
    cancelNotesEditing,
    closeNotesView,
    saveNotes,
    organizeNotes,
    applyAiResult,
    restorePreAiDraft,
    handleNotesChange,
  }
}
