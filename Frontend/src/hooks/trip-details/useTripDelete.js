import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteTrip } from '../../services/tripService'
import { useAuth } from '../useAuth'
import { useTrips } from '../useTrips'

export function useTripDelete({ trip }) {
  const { idToken } = useAuth()
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

    try {
      setIsDeleting(true)
      setDeleteError('')

      await deleteTrip(trip.id, idToken)

      removeTripFromCache(trip.id)

      navigate('/trips', {
        replace: true,
      })
    } catch (error) {
      console.error(
        'Failed to delete trip:',
        error,
      )

      setDeleteError(
        'Could not delete the trip. Please try again.',
      )
    } finally {
      setIsDeleting(false)
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