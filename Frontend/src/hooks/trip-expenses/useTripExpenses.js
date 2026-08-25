import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  clearCachedTripExpenses,
  getCachedTripExpenses,
  setCachedTripExpenses,
} from '../../services/expenseCacheService'
import {
  createTripExpense,
  deleteTripExpense,
  getTripExpenses,
  updateTripExpense,
} from '../../services/expenseService'
import {
  getOrCreateTripExpensesRequest,
  releaseTripExpensesRequest,
} from '../../services/trips/tripsRequestManager'
import { useAuth } from '../useAuth'

export function useTripExpenses(
  tripId,
) {
  const {
    firebaseUser,
    idToken,
  } = useAuth()

  const userId =
    firebaseUser?.uid ?? null

  const [expenses, setExpenses] =
    useState([])

  const expensesRef =
    useRef([])

  const [
    loadedTripId,
    setLoadedTripId,
  ] = useState(null)

  const [
    reloadVersion,
    setReloadVersion,
  ] = useState(0)

  const [
    expensesError,
    setExpensesError,
  ] = useState('')

  const [
    expenseActionError,
    setExpenseActionError,
  ] = useState('')

  const [
    isCreatingExpense,
    setIsCreatingExpense,
  ] = useState(false)

  const [
    updatingExpenseId,
    setUpdatingExpenseId,
  ] = useState(null)

  const [
    deletingExpenseId,
    setDeletingExpenseId,
  ] = useState(null)

  const applyExpenses = (
    nextExpenses,
  ) => {
    expensesRef.current =
      nextExpenses

    setExpenses(nextExpenses)

    if (userId && tripId) {
      setCachedTripExpenses(
        userId,
        tripId,
        nextExpenses,
      )
    }
  }

  useEffect(() => {
    if (
      !tripId ||
      !userId ||
      !idToken
    ) {
      return undefined
    }

    let isActive = true
    let expensesRequest = null

    const loadExpenses =
      async () => {
        /*
         * Keep cache/server loading behind
         * the same asynchronous boundary.
         * This avoids synchronous setState
         * calls directly inside the effect.
         */
        await Promise.resolve()

        if (!isActive) {
          return
        }

        const cachedExpenses =
          getCachedTripExpenses(
            userId,
            tripId,
          )

        if (cachedExpenses) {
          expensesRef.current =
            cachedExpenses

          setExpenses(
            cachedExpenses,
          )

          setExpensesError('')
          setLoadedTripId(tripId)

          return
        }

        expensesRequest =
          getOrCreateTripExpensesRequest(
            userId,
            tripId,
            () =>
              getTripExpenses(
                tripId,
                idToken,
              ),
          )

        try {
          const result =
            await expensesRequest

          if (!isActive) {
            return
          }

          const loadedExpenses =
            Array.isArray(result)
              ? result
              : []

          expensesRef.current =
            loadedExpenses

          setExpenses(
            loadedExpenses,
          )

          setCachedTripExpenses(
            userId,
            tripId,
            loadedExpenses,
          )

          setExpensesError('')
          setLoadedTripId(tripId)
        } catch (error) {
          if (!isActive) {
            return
          }

          console.error(
            'Failed to load trip expenses:',
            error,
          )

          setExpensesError(
            'Could not load trip expenses. Please try again.',
          )

          setLoadedTripId(tripId)
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
    reloadVersion,
  ])

  const isLoadingExpenses =
    Boolean(
      tripId &&
      userId &&
      idToken &&
      loadedTripId !== tripId,
    )

  const visibleExpenses =
    tripId &&
    userId &&
    idToken &&
    loadedTripId === tripId
      ? expenses
      : []

  const reloadExpenses = () => {
    if (
      !tripId ||
      !userId ||
      !idToken
    ) {
      return
    }

    clearCachedTripExpenses(
      userId,
      tripId,
    )

    expensesRef.current = []

    setExpenses([])
    setExpensesError('')
    setLoadedTripId(null)

    setReloadVersion(
      (currentVersion) =>
        currentVersion + 1,
    )
  }

  const addExpense = async (
    expenseData,
  ) => {
    if (
      !tripId ||
      !userId ||
      !idToken ||
      isCreatingExpense
    ) {
      return null
    }

    try {
      setIsCreatingExpense(true)
      setExpenseActionError('')

      const createdExpense =
        await createTripExpense(
          tripId,
          expenseData,
          idToken,
        )

      const nextExpenses = [
        createdExpense,
        ...expensesRef.current,
      ]

      applyExpenses(
        nextExpenses,
      )

      return createdExpense
    } catch (error) {
      console.error(
        'Failed to create trip expense:',
        error,
      )

      setExpenseActionError(
        'Could not add the expense. Please try again.',
      )

      return null
    } finally {
      setIsCreatingExpense(false)
    }
  }

  const editExpense = async (
    expenseId,
    expenseData,
  ) => {
    if (
      !tripId ||
      !userId ||
      !expenseId ||
      !idToken ||
      updatingExpenseId
    ) {
      return null
    }

    try {
      setUpdatingExpenseId(
        expenseId,
      )

      setExpenseActionError('')

      const updatedExpense =
        await updateTripExpense(
          tripId,
          expenseId,
          expenseData,
          idToken,
        )

      const nextExpenses =
        expensesRef.current.map(
          (expense) =>
            expense.id ===
            expenseId
              ? updatedExpense
              : expense,
        )

      applyExpenses(
        nextExpenses,
      )

      return updatedExpense
    } catch (error) {
      console.error(
        'Failed to update trip expense:',
        error,
      )

      setExpenseActionError(
        'Could not update the expense. Please try again.',
      )

      return null
    } finally {
      setUpdatingExpenseId(null)
    }
  }

  const removeExpense = async (
    expenseId,
  ) => {
    if (
      !tripId ||
      !userId ||
      !expenseId ||
      !idToken ||
      deletingExpenseId
    ) {
      return false
    }

    try {
      setDeletingExpenseId(
        expenseId,
      )

      setExpenseActionError('')

      await deleteTripExpense(
        tripId,
        expenseId,
        idToken,
      )

      const nextExpenses =
        expensesRef.current.filter(
          (expense) =>
            expense.id !==
            expenseId,
        )

      applyExpenses(
        nextExpenses,
      )

      return true
    } catch (error) {
      console.error(
        'Failed to delete trip expense:',
        error,
      )

      setExpenseActionError(
        'Could not delete the expense. Please try again.',
      )

      return false
    } finally {
      setDeletingExpenseId(null)
    }
  }

  const clearExpenseActionError =
    () => {
      setExpenseActionError('')
    }

  return {
    expenses: visibleExpenses,

    isLoadingExpenses,
    expensesError,
    expenseActionError,

    isCreatingExpense,
    updatingExpenseId,
    deletingExpenseId,

    reloadExpenses,
    addExpense,
    editExpense,
    removeExpense,
    clearExpenseActionError,
  }
}