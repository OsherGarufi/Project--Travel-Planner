import { useEffect, useRef, useState } from 'react'
import {
  clearCachedTripExpenses,
  getCachedTripExpenses,
  getTripExpensesCacheKey,
  setCachedTripExpenses,
  syncCachedTripExpensesFromStorage,
} from '../../services/expenseCacheService'
import { getTripExpenses } from '../../services/expenseService'
import {
  getOrCreateTripExpensesRequest,
  releaseTripExpensesRequest,
} from '../../services/trips/tripsRequestManager'
import { useAuth } from '../useAuth'
import { useFeedback } from '../useFeedback'
import { reconcileExpenseItemsForTripDateRange } from './expenseReconciliation'
import { useExpenseMutations } from './useExpenseMutations'

export function useTripExpenses(tripId) {
  const {
    firebaseUser,
    idToken,
    captureAuthSession,
    isAuthSessionCurrent,
  } = useAuth()
  const { showError } = useFeedback()

  const userId = firebaseUser?.uid ?? null
  const expensesContextKey =
    userId && tripId ? `${userId}:${tripId}` : null

  const [expenses, setExpenses] = useState([])
  const expensesRef = useRef([])
  const pendingDateRangeRef = useRef(null)
  const [loadedContextKey, setLoadedContextKey] =
    useState(null)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [expensesError, setExpensesError] = useState('')

  const applyExpenses = (nextExpenses) => {
    expensesRef.current = nextExpenses
    setExpenses(nextExpenses)

    if (userId && tripId) {
      setCachedTripExpenses(userId, tripId, nextExpenses)
    }
  }

  useEffect(() => {
    let isActive = true
    let expensesRequest = null

    const loadExpenses = async () => {
      await Promise.resolve()

      if (!isActive) {
        return
      }

      if (
        !tripId ||
        !userId ||
        !idToken ||
        !expensesContextKey
      ) {
        pendingDateRangeRef.current = null
        expensesRef.current = []
        setExpenses([])
        setLoadedContextKey(null)
        setExpensesError('')
        return
      }

      const hydrateExpenses = (
        nextExpenses,
        persistExpenses = false,
      ) => {
        const pendingDateRange = pendingDateRangeRef.current
        const hydratedExpenses =
          pendingDateRange?.contextKey === expensesContextKey
            ? reconcileExpenseItemsForTripDateRange(
                nextExpenses,
                pendingDateRange.startDate,
                pendingDateRange.endDate,
              )
            : nextExpenses

        if (
          pendingDateRange?.contextKey === expensesContextKey
        ) {
          pendingDateRangeRef.current = null
        }

        expensesRef.current = hydratedExpenses
        setExpenses(hydratedExpenses)

        if (
          persistExpenses ||
          hydratedExpenses !== nextExpenses
        ) {
          setCachedTripExpenses(
            userId,
            tripId,
            hydratedExpenses,
          )
        }

        setExpensesError('')
        setLoadedContextKey(expensesContextKey)
      }

      const cachedExpenses = getCachedTripExpenses(
        userId,
        tripId,
      )

      if (Array.isArray(cachedExpenses)) {
        hydrateExpenses(cachedExpenses)
        return
      }

      expensesRef.current = []
      setExpenses([])
      setLoadedContextKey(null)
      setExpensesError('')

      expensesRequest = getOrCreateTripExpensesRequest(
        userId,
        tripId,
        () => getTripExpenses(tripId, idToken),
      )

      try {
        const result = await expensesRequest

        if (!isActive) {
          return
        }

        hydrateExpenses(
          Array.isArray(result) ? result : [],
          true,
        )
      } catch (error) {
        if (!isActive) {
          return
        }

        console.error('Failed to load trip expenses:', error)
        expensesRef.current = []
        setExpenses([])
        setExpensesError(
          'Could not load trip expenses. Please try again.',
        )
        setLoadedContextKey(expensesContextKey)
      } finally {
        if (expensesRequest) {
          releaseTripExpensesRequest(
            userId,
            tripId,
            expensesRequest,
          )
        }
      }
    }

    loadExpenses()

    return () => {
      isActive = false
    }
  }, [
    tripId,
    userId,
    idToken,
    expensesContextKey,
    reloadVersion,
  ])

  useEffect(() => {
    if (
      !userId ||
      !tripId ||
      !expensesContextKey ||
      loadedContextKey !== expensesContextKey
    ) {
      return undefined
    }

    const cacheKey = getTripExpensesCacheKey(userId, tripId)
    const handleStorageChange = (event) => {
      if (
        event.storageArea !== localStorage ||
        event.key !== cacheKey ||
        !event.newValue
      ) {
        return
      }

      const nextExpenses = syncCachedTripExpensesFromStorage(
        userId,
        tripId,
        event.newValue,
      )

      if (!Array.isArray(nextExpenses)) {
        return
      }

      expensesRef.current = nextExpenses
      setExpenses(nextExpenses)
      setExpensesError('')
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [
    userId,
    tripId,
    expensesContextKey,
    loadedContextKey,
  ])

  const hasExpensesContext = Boolean(
    tripId && userId && idToken && expensesContextKey,
  )
  const isLoadingExpenses = Boolean(
    hasExpensesContext &&
      loadedContextKey !== expensesContextKey,
  )
  const visibleExpenses =
    hasExpensesContext &&
    loadedContextKey === expensesContextKey
      ? expenses
      : []

  const reloadExpenses = () => {
    if (!tripId || !userId || !idToken) {
      return
    }

    clearCachedTripExpenses(userId, tripId)
    expensesRef.current = []
    setExpenses([])
    setExpensesError('')
    setLoadedContextKey(null)
    setReloadVersion(
      (currentVersion) => currentVersion + 1,
    )
  }

  const reconcileExpensesForTripDateRange = (
    startDate,
    endDate,
  ) => {
    if (!startDate || !endDate || !expensesContextKey) {
      return
    }

    pendingDateRangeRef.current = {
      contextKey: expensesContextKey,
      startDate,
      endDate,
    }

    if (loadedContextKey !== expensesContextKey) {
      return
    }

    const nextExpenses = reconcileExpenseItemsForTripDateRange(
      expensesRef.current,
      startDate,
      endDate,
    )

    pendingDateRangeRef.current = null

    if (nextExpenses !== expensesRef.current) {
      applyExpenses(nextExpenses)
    }
  }

  const mutationController = useExpenseMutations({
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
  })

  return {
    expenses: visibleExpenses,

    isLoadingExpenses,
    expensesError,
    expenseActionError: mutationController.expenseActionError,

    isCreatingExpense: mutationController.isCreatingExpense,
    updatingExpenseId: mutationController.updatingExpenseId,
    deletingExpenseId: mutationController.deletingExpenseId,

    reloadExpenses,
    reconcileExpensesForTripDateRange,

    addExpense: mutationController.addExpense,
    addExpenseActivity: mutationController.addExpenseActivity,

    editExpenseEntry: mutationController.editExpenseEntry,
    removeExpense: mutationController.removeExpense,

    clearExpenseActionError:
      mutationController.clearExpenseActionError,
  }
}
