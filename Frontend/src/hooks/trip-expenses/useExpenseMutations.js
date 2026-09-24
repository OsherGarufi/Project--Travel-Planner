import { useState } from 'react'
import {
  clearCachedTripExpenses,
  getCachedTripExpenses,
} from '../../services/expenseCacheService'
import {
  createTripExpense,
  deleteTripExpense,
  getTripExpenses,
  transitionTripExpense,
  updateTripExpense,
} from '../../services/expenseService'
import {
  clearTripItineraryCache,
  getTripItineraryCache,
  setTripItineraryCache,
} from '../../services/itinerary/itineraryCache'
import {
  syncExpensesCacheFromItineraryItem,
  syncItineraryCacheAfterExpenseDelete,
  syncItineraryCacheFromExpense,
} from '../../services/itinerary/itineraryExpenseCacheSync'
import {
  createTripItineraryItem,
  getTripItinerary,
  updateTripItineraryItem,
} from '../../services/itinerary/itineraryService'
import {
  createExpensePayload,
  createItineraryPayload,
  prependExpense,
  removeExpenseById,
  replaceExpense,
} from './expenseReconciliation'

const EXPENSE_ENTRY_TYPES = {
  SCHEDULED: 'scheduled',
  PLAN_LATER: 'plan-later',
  ONLY_EXPENSE: 'only-expense',
}

function hasAuthoritativeApiResponse(error) {
  return /^API Error: \d+$/.test(
    error?.message ?? '',
  )
}

export function useExpenseMutations({
  tripId,
  userId,
  idToken,
  expensesContextKey,
  loadedContextKey,
  expensesRef,
  setExpenses,
  applyExpenses,
  captureAuthSession,
  isAuthSessionCurrent,
  showError,
}) {
  const [expenseActionError, setExpenseActionError] =
    useState('')
  const [isCreatingExpense, setIsCreatingExpense] =
    useState(false)
  const [updatingExpenseId, setUpdatingExpenseId] =
    useState(null)
  const [deletingExpenseId, setDeletingExpenseId] =
    useState(null)

  const updateCachedItineraryItem = (updatedItem) => {
    const cachedItems = getTripItineraryCache(
      userId,
      tripId,
    )

    if (!Array.isArray(cachedItems)) {
      return
    }

    const itemExists = cachedItems.some(
      (item) => item.id === updatedItem.id,
    )

    const nextItems = itemExists
      ? cachedItems.map((item) =>
          item.id === updatedItem.id
            ? updatedItem
            : item,
        )
      : [...cachedItems, updatedItem]

    setTripItineraryCache(
      userId,
      tripId,
      nextItems,
    )
  }

  const removeCachedItineraryItem = (itemId) => {
    const cachedItems = getTripItineraryCache(
      userId,
      tripId,
    )

    if (!Array.isArray(cachedItems)) {
      return
    }

    setTripItineraryCache(
      userId,
      tripId,
      cachedItems.filter(
        (item) => item.id !== itemId,
      ),
    )
  }

  const reconcileAfterAmbiguousTransition =
    async (authSession) => {
      const [expensesResult, itineraryResult] =
        await Promise.allSettled([
          getTripExpenses(tripId, idToken),
          getTripItinerary(tripId, idToken),
        ])

      if (!isAuthSessionCurrent(authSession)) {
        return
      }

      if (
        expensesResult.status === 'fulfilled' &&
        Array.isArray(expensesResult.value)
      ) {
        applyExpenses(expensesResult.value)
      } else {
        clearCachedTripExpenses(userId, tripId)
      }

      if (
        itineraryResult.status === 'fulfilled' &&
        Array.isArray(itineraryResult.value)
      ) {
        setTripItineraryCache(
          userId,
          tripId,
          itineraryResult.value,
        )
      } else {
        clearTripItineraryCache(userId, tripId)
      }
    }

  const addExpense = async (expenseData) => {
    if (
      !tripId ||
      !userId ||
      !idToken ||
      loadedContextKey !== expensesContextKey ||
      isCreatingExpense
    ) {
      return null
    }

    const authSession = captureAuthSession()

    if (!authSession) {
      return null
    }

    try {
      setIsCreatingExpense(true)
      setExpenseActionError('')

      const createdExpense = await createTripExpense(
        tripId,
        expenseData,
        idToken,
      )

      if (!isAuthSessionCurrent(authSession)) {
        return null
      }

      if (!createdExpense?.id) {
        throw new Error('Invalid expense response.')
      }

      applyExpenses(
        prependExpense(
          expensesRef.current,
          createdExpense,
        ),
      )

      syncItineraryCacheFromExpense(
        userId,
        tripId,
        createdExpense,
      )

      return createdExpense
    } catch (error) {
      if (!isAuthSessionCurrent(authSession)) {
        return null
      }

      console.error(
        'Failed to create trip expense:',
        error,
      )
      setExpenseActionError(
        'Could not add the expense. Please try again.',
      )
      showError(
        'Could not add the expense. Please try again.',
      )
      return null
    } finally {
      if (isAuthSessionCurrent(authSession)) {
        setIsCreatingExpense(false)
      }
    }
  }

  const addExpenseActivity = async (itemData) => {
    if (
      !tripId ||
      !userId ||
      !idToken ||
      loadedContextKey !== expensesContextKey ||
      isCreatingExpense
    ) {
      return null
    }

    const authSession = captureAuthSession()

    if (!authSession) {
      return null
    }

    try {
      setIsCreatingExpense(true)
      setExpenseActionError('')

      const createdItem = await createTripItineraryItem(
        tripId,
        itemData,
        idToken,
      )

      if (!isAuthSessionCurrent(authSession)) {
        return null
      }

      if (!createdItem?.id || !createdItem?.expenseId) {
        throw new Error(
          'Invalid linked activity response.',
        )
      }

      updateCachedItineraryItem(createdItem)

      syncExpensesCacheFromItineraryItem(
        userId,
        tripId,
        createdItem,
      )

      const nextExpenses = getCachedTripExpenses(
        userId,
        tripId,
      )

      if (!Array.isArray(nextExpenses)) {
        throw new Error(
          'Could not synchronize the expense cache.',
        )
      }

      expensesRef.current = nextExpenses
      setExpenses(nextExpenses)

      return createdItem
    } catch (error) {
      if (!isAuthSessionCurrent(authSession)) {
        return null
      }

      console.error(
        'Failed to create linked trip activity:',
        error,
      )
      setExpenseActionError(
        'Could not add the trip item. Please try again.',
      )
      showError(
        'Could not add the trip item. Please try again.',
      )
      return null
    } finally {
      if (isAuthSessionCurrent(authSession)) {
        setIsCreatingExpense(false)
      }
    }
  }

  const editExpenseEntry = async (
    expenseId,
    entryData,
  ) => {
    if (
      !tripId ||
      !userId ||
      !expenseId ||
      !idToken ||
      !entryData ||
      loadedContextKey !== expensesContextKey ||
      updatingExpenseId
    ) {
      return null
    }

    const currentExpense =
      expensesRef.current.find(
        (expense) => expense.id === expenseId,
      ) ?? null

    if (!currentExpense) {
      return null
    }

    const currentIsLinked = Boolean(
      currentExpense.itineraryItemId,
    )
    const targetIsOnlyExpense =
      entryData.entryType ===
      EXPENSE_ENTRY_TYPES.ONLY_EXPENSE
    const targetIsLinked =
      entryData.entryType ===
        EXPENSE_ENTRY_TYPES.SCHEDULED ||
      entryData.entryType ===
        EXPENSE_ENTRY_TYPES.PLAN_LATER

    if (!targetIsOnlyExpense && !targetIsLinked) {
      return null
    }

    const authSession = captureAuthSession()

    if (!authSession) {
      return null
    }

    const expenseData = createExpensePayload(entryData)
    const itineraryData = createItineraryPayload(entryData)
    let transitionWasAttempted = false

    try {
      setUpdatingExpenseId(expenseId)
      setExpenseActionError('')

      if (!currentIsLinked && targetIsOnlyExpense) {
        const updatedExpense = await updateTripExpense(
          tripId,
          expenseId,
          expenseData,
          idToken,
        )

        if (!isAuthSessionCurrent(authSession)) {
          return null
        }

        if (!updatedExpense?.id) {
          throw new Error('Invalid expense response.')
        }

        applyExpenses(
          replaceExpense(
            expensesRef.current,
            expenseId,
            updatedExpense,
          ),
        )
        return updatedExpense
      }

      if (currentIsLinked && targetIsLinked) {
        const cachedItems = getTripItineraryCache(
          userId,
          tripId,
        )
        const previousItem = Array.isArray(cachedItems)
          ? cachedItems.find(
              (item) =>
                item.id === currentExpense.itineraryItemId,
            ) ?? null
          : null

        const updatedItem = await updateTripItineraryItem(
          tripId,
          currentExpense.itineraryItemId,
          itineraryData,
          idToken,
        )

        if (!isAuthSessionCurrent(authSession)) {
          return null
        }

        if (!updatedItem?.id || !updatedItem?.expenseId) {
          throw new Error(
            'Invalid linked activity response.',
          )
        }

        updateCachedItineraryItem(updatedItem)
        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          updatedItem,
          previousItem,
        )

        const syncedExpenses = getCachedTripExpenses(
          userId,
          tripId,
        )

        if (!Array.isArray(syncedExpenses)) {
          throw new Error(
            'Could not synchronize the expense cache.',
          )
        }

        expensesRef.current = syncedExpenses
        setExpenses(syncedExpenses)

        return (
          syncedExpenses.find(
            (expense) =>
              expense.id === updatedItem.expenseId,
          ) ?? null
        )
      }

      if (currentIsLinked && targetIsOnlyExpense) {
        transitionWasAttempted = true

        const transitionResult = await transitionTripExpense(
          tripId,
          expenseId,
          expenseData,
          idToken,
        )

        if (!isAuthSessionCurrent(authSession)) {
          return null
        }

        if (
          !transitionResult?.expense?.id ||
          transitionResult.replacedExpenseId !== expenseId ||
          transitionResult.itineraryItem ||
          transitionResult.removedItineraryItemId !==
            currentExpense.itineraryItemId
        ) {
          throw new Error(
            'Invalid expense transition response.',
          )
        }

        removeCachedItineraryItem(
          transitionResult.removedItineraryItemId,
        )
        applyExpenses(
          replaceExpense(
            expensesRef.current,
            transitionResult.replacedExpenseId,
            transitionResult.expense,
          ),
        )
        return transitionResult.expense
      }

      transitionWasAttempted = true

      const transitionResult = await transitionTripExpense(
        tripId,
        expenseId,
        {
          ...expenseData,
          itinerary: {
            itineraryDate: itineraryData.itineraryDate,
            startTime: itineraryData.startTime,
            endTime: itineraryData.endTime,
          },
        },
        idToken,
      )

      if (!isAuthSessionCurrent(authSession)) {
        return null
      }

      if (
        !transitionResult?.expense?.id ||
        !transitionResult?.itineraryItem?.id ||
        transitionResult.itineraryItem.expenseId !==
          transitionResult.expense.id ||
        transitionResult.replacedExpenseId !== expenseId ||
        transitionResult.removedItineraryItemId
      ) {
        throw new Error(
          'Invalid expense transition response.',
        )
      }

      updateCachedItineraryItem(
        transitionResult.itineraryItem,
      )
      applyExpenses(
        replaceExpense(
          expensesRef.current,
          transitionResult.replacedExpenseId,
          transitionResult.expense,
        ),
      )
      return transitionResult.expense
    } catch (error) {
      if (!isAuthSessionCurrent(authSession)) {
        return null
      }

      if (
        transitionWasAttempted &&
        !hasAuthoritativeApiResponse(error)
      ) {
        await reconcileAfterAmbiguousTransition(authSession)

        if (!isAuthSessionCurrent(authSession)) {
          return null
        }
      }

      console.error(
        'Failed to update trip expense entry:',
        error,
      )
      setExpenseActionError(
        'Could not update the expense. Please try again.',
      )
      showError(
        'Could not update the expense. Please try again.',
      )
      return null
    } finally {
      if (isAuthSessionCurrent(authSession)) {
        setUpdatingExpenseId(null)
      }
    }
  }

  const removeExpense = async (
    expenseId,
    deleteLinkedActivity = null,
  ) => {
    if (
      !tripId ||
      !userId ||
      !expenseId ||
      !idToken ||
      loadedContextKey !== expensesContextKey ||
      deletingExpenseId
    ) {
      return false
    }

    const authSession = captureAuthSession()

    if (!authSession) {
      return false
    }

    const expenseToDelete = expensesRef.current.find(
      (expense) => expense.id === expenseId,
    )

    try {
      setDeletingExpenseId(expenseId)
      setExpenseActionError('')

      await deleteTripExpense(
        tripId,
        expenseId,
        idToken,
        deleteLinkedActivity,
      )

      if (!isAuthSessionCurrent(authSession)) {
        return false
      }

      applyExpenses(
        removeExpenseById(
          expensesRef.current,
          expenseId,
        ),
      )

      if (expenseToDelete) {
        syncItineraryCacheAfterExpenseDelete(
          userId,
          tripId,
          expenseToDelete,
          deleteLinkedActivity,
        )
      }

      return true
    } catch (error) {
      if (!isAuthSessionCurrent(authSession)) {
        return false
      }

      console.error(
        'Failed to delete trip expense:',
        error,
      )
      setExpenseActionError(
        'Could not delete the expense. Please try again.',
      )
      showError(
        'Could not delete the expense. Please try again.',
      )
      return false
    } finally {
      if (isAuthSessionCurrent(authSession)) {
        setDeletingExpenseId(null)
      }
    }
  }

  const clearExpenseActionError = () => {
    setExpenseActionError('')
  }

  return {
    expenseActionError,
    isCreatingExpense,
    updatingExpenseId,
    deletingExpenseId,
    addExpense,
    addExpenseActivity,
    editExpenseEntry,
    removeExpense,
    clearExpenseActionError,
  }
}
