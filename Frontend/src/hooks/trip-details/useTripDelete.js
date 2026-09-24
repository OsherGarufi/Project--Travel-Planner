import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteTrip } from '../../services/tripService'
import { useAuth } from '../useAuth'
import { useFeedback } from '../useFeedback'
import { useTrips } from '../useTrips'

export function useTripDelete({ trip }) {
  const {
    idToken,
    captureAuthSession,
    isAuthSessionCurrent,
  } = useAuth()
  const { showSuccess, showError } =
    useFeedback()
  const { removeTripFromCache } = useTrips()
  const navigate = useNavigate()

  const [
    isConfirmingDelete,
    setIsConfirmingDelete,
  ] = useState(false)

  const [isDeleting, setIsDeleting] =
    useState(false)

  const [deleteError, setDeleteError] =
    useState('')

  const startDelete = () => {
    setDeleteError('')
    setIsConfirmingDelete(true)
  }

  const cancelDelete = () => {
    if (isDeleting) {
      return
    }

    setDeleteError('')
    setIsConfirmingDelete(false)
  }

  const resetDelete = () => {
    if (isDeleting) {
      return
    }

    setDeleteError('')
    setIsConfirmingDelete(false)
  }

  const confirmDelete = async () => {
    if (!trip?.id || !idToken || isDeleting) {
      return
    }

    const authSession =
      captureAuthSession()

    if (!authSession) {
      return
    }

    try {
      setIsDeleting(true)
      setDeleteError('')

      await deleteTrip(trip.id, idToken)

      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return
      }

      removeTripFromCache(trip.id)

      showSuccess('Trip deleted.')

      navigate('/trips', {
        replace: true,
      })
    } catch (error) {
      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return
      }

      console.error(
        'Failed to delete trip:',
        error,
      )

      setDeleteError(
        'Could not delete the trip. Please try again.',
      )

      showError(
        'Could not delete the trip. Please try again.',
      )
    } finally {
      if (
        isAuthSessionCurrent(
          authSession,
        )
      ) {
        setIsDeleting(false)
      }
    }
  }

  return {
    isConfirmingDelete,
    isDeleting,
    deleteError,
    startDelete,
    cancelDelete,
    resetDelete,
    confirmDelete,
  }
}
