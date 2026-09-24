import {
  useCallback,
  useState,
} from 'react'
import {
  syncExpensesCacheAfterItineraryDelete,
  syncExpensesCacheFromItineraryItem,
} from '../../services/itinerary/itineraryExpenseCacheSync'
import {
  queueItineraryScheduleSave,
  supersedeItineraryScheduleSave,
} from '../../services/itinerary/itineraryScheduleSaveManager'
import {
  createTripItineraryItem,
  deleteTripItineraryItem,
  updateTripItineraryItem,
  updateTripItinerarySchedule,
} from '../../services/itinerary/itineraryService'
import {
  appendItineraryItem,
  removeItineraryItem,
  replaceItineraryItem,
} from './itineraryReconciliation'

export function useItineraryMutations({
  tripId,
  userId,
  idToken,
  itineraryContextKey,
  loadedContextKey,
  itineraryItemsRef,
  applyConfirmedItineraryItems,
  applyOptimisticItineraryItems,
  captureAuthSession,
  isAuthSessionCurrent,
  showError,
}) {
  const [
    itineraryActionError,
    setItineraryActionError,
  ] = useState('')

  const [
    isCreatingItineraryItem,
    setIsCreatingItineraryItem,
  ] = useState(false)

  const [
    isUpdatingItineraryItem,
    setIsUpdatingItineraryItem,
  ] = useState(false)

  const [
    isUpdatingItinerarySchedule,
    setIsUpdatingItinerarySchedule,
  ] = useState(false)

  const [
    isDeletingItineraryItem,
    setIsDeletingItineraryItem,
  ] = useState(false)

  const queueItineraryScheduleUpdate = (
    itemId,
    scheduleData,
  ) => {
    if (
      !tripId ||
      !userId ||
      !idToken ||
      !itemId ||
      loadedContextKey !==
        itineraryContextKey ||
      isUpdatingItineraryItem ||
      isUpdatingItinerarySchedule ||
      isDeletingItineraryItem
    ) {
      return null
    }

    const currentItem =
      itineraryItemsRef.current.find(
        (item) => item.id === itemId,
      ) ?? null

    if (!currentItem) {
      return null
    }

    const optimisticItem = {
      ...currentItem,
      itineraryDate:
        scheduleData.itineraryDate,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
    }

    queueItineraryScheduleSave({
      userId,
      tripId,
      itemId,
      confirmedItem: currentItem,
      optimisticItem,
    })

    setItineraryActionError('')

    applyOptimisticItineraryItems(
      replaceItineraryItem(
        itineraryItemsRef.current,
        itemId,
        optimisticItem,
      ),
    )

    syncExpensesCacheFromItineraryItem(
      userId,
      tripId,
      optimisticItem,
      currentItem,
      { persist: false },
    )

    return optimisticItem
  }

  const addItineraryItem =
    async (itemData) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        loadedContextKey !==
          itineraryContextKey ||
        isCreatingItineraryItem
      ) {
        return null
      }

      const authSession =
        captureAuthSession()

      if (!authSession) {
        return null
      }

      try {
        setIsCreatingItineraryItem(true)
        setItineraryActionError('')

        const createdItem =
          await createTripItineraryItem(
            tripId,
            itemData,
            idToken,
          )

        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        if (!createdItem?.id) {
          throw new Error(
            'Invalid itinerary item response.',
          )
        }

        applyConfirmedItineraryItems(
          appendItineraryItem(
            itineraryItemsRef.current,
            createdItem,
          ),
        )

        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          createdItem,
        )

        return createdItem
      } catch (error) {
        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        console.error(
          'Failed to create itinerary item:',
          error,
        )

        const errorMessage =
          'Could not add the itinerary item. Please try again.'

        setItineraryActionError(errorMessage)
        showError(errorMessage)

        return null
      } finally {
        if (
          isAuthSessionCurrent(
            authSession,
          )
        ) {
          setIsCreatingItineraryItem(false)
        }
      }
    }

  const updateItineraryItem =
    async (itemId, itemData) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        !itemId ||
        loadedContextKey !==
          itineraryContextKey ||
        isUpdatingItineraryItem
      ) {
        return null
      }

      const authSession =
        captureAuthSession()

      if (!authSession) {
        return null
      }

      await supersedeItineraryScheduleSave(
        userId,
        tripId,
        itemId,
      )

      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return null
      }

      const previousItem =
        itineraryItemsRef.current.find(
          (item) => item.id === itemId,
        ) ?? null

      try {
        setIsUpdatingItineraryItem(true)
        setItineraryActionError('')

        const updatedItem =
          await updateTripItineraryItem(
            tripId,
            itemId,
            itemData,
            idToken,
          )

        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        if (!updatedItem?.id) {
          throw new Error(
            'Invalid itinerary item response.',
          )
        }

        applyConfirmedItineraryItems(
          replaceItineraryItem(
            itineraryItemsRef.current,
            itemId,
            updatedItem,
          ),
        )

        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          updatedItem,
          previousItem,
        )

        return updatedItem
      } catch (error) {
        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        console.error(
          'Failed to update itinerary item:',
          error,
        )

        const errorMessage =
          'Could not update the itinerary item. Please try again.'

        setItineraryActionError(errorMessage)
        showError(errorMessage)

        return null
      } finally {
        if (
          isAuthSessionCurrent(
            authSession,
          )
        ) {
          setIsUpdatingItineraryItem(false)
        }
      }
    }

  const updateItinerarySchedule =
    async (itemId, scheduleData) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        !itemId ||
        loadedContextKey !==
          itineraryContextKey ||
        isUpdatingItinerarySchedule
      ) {
        return null
      }

      const authSession =
        captureAuthSession()

      if (!authSession) {
        return null
      }

      await supersedeItineraryScheduleSave(
        userId,
        tripId,
        itemId,
      )

      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return null
      }

      const previousItem =
        itineraryItemsRef.current.find(
          (item) => item.id === itemId,
        ) ?? null

      try {
        setIsUpdatingItinerarySchedule(
          true,
        )
        setItineraryActionError('')

        const updatedItem =
          await updateTripItinerarySchedule(
            tripId,
            itemId,
            scheduleData,
            idToken,
          )

        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        if (!updatedItem?.id) {
          throw new Error(
            'Invalid itinerary schedule response.',
          )
        }

        applyConfirmedItineraryItems(
          replaceItineraryItem(
            itineraryItemsRef.current,
            itemId,
            updatedItem,
          ),
        )

        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          updatedItem,
          previousItem,
        )

        return updatedItem
      } catch (error) {
        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return null
        }

        console.error(
          'Failed to update itinerary schedule:',
          error,
        )

        const errorMessage =
          'Could not update the activity schedule. Please try again.'

        setItineraryActionError(errorMessage)
        showError(errorMessage)

        return null
      } finally {
        if (
          isAuthSessionCurrent(
            authSession,
          )
        ) {
          setIsUpdatingItinerarySchedule(
            false,
          )
        }
      }
    }

  const deleteItineraryItem =
    async (itemId) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        !itemId ||
        loadedContextKey !==
          itineraryContextKey ||
        isDeletingItineraryItem
      ) {
        return false
      }

      const authSession =
        captureAuthSession()

      if (!authSession) {
        return false
      }

      await supersedeItineraryScheduleSave(
        userId,
        tripId,
        itemId,
      )

      if (
        !isAuthSessionCurrent(
          authSession,
        )
      ) {
        return false
      }

      const itemToDelete =
        itineraryItemsRef.current.find(
          (item) => item.id === itemId,
        ) ?? null

      try {
        setIsDeletingItineraryItem(true)
        setItineraryActionError('')

        await deleteTripItineraryItem(
          tripId,
          itemId,
          idToken,
        )

        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return false
        }

        applyConfirmedItineraryItems(
          removeItineraryItem(
            itineraryItemsRef.current,
            itemId,
          ),
        )

        if (itemToDelete) {
          syncExpensesCacheAfterItineraryDelete(
            userId,
            tripId,
            itemToDelete,
          )
        }

        return true
      } catch (error) {
        if (
          !isAuthSessionCurrent(
            authSession,
          )
        ) {
          return false
        }

        console.error(
          'Failed to delete itinerary item:',
          error,
        )

        const errorMessage =
          'Could not delete the itinerary item. Please try again.'

        setItineraryActionError(errorMessage)
        showError(errorMessage)

        return false
      } finally {
        if (
          isAuthSessionCurrent(
            authSession,
          )
        ) {
          setIsDeletingItineraryItem(false)
        }
      }
    }

  const clearItineraryActionError = () => {
    setItineraryActionError('')
  }

  const reportScheduleSaveFailure =
    useCallback(() => {
      const errorMessage =
        'Could not save the new activity schedule. The previous schedule was restored.'

      setItineraryActionError(errorMessage)
      showError(errorMessage)
    }, [showError])

  return {
    itineraryActionError,
    isCreatingItineraryItem,
    isUpdatingItineraryItem,
    isUpdatingItinerarySchedule,
    isDeletingItineraryItem,
    addItineraryItem,
    updateItineraryItem,
    updateItinerarySchedule,
    queueItineraryScheduleUpdate,
    deleteItineraryItem,
    clearItineraryActionError,
    reportScheduleSaveFailure,
  }
}
