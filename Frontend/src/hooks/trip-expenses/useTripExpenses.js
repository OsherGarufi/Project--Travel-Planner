import {
    useEffect,
    useState,
} from 'react'
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

export function useTripExpenses(tripId) {
  const {
    firebaseUser,
    idToken,
  } = useAuth()

  const userId =
    firebaseUser?.uid ?? null

  const [expenses, setExpenses] =
    useState([])

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

  useEffect(() => {
    if (
      !tripId ||
      !userId ||
      !idToken
    ) {
      return undefined
    }

    let isActive = true

    const expensesRequest =
      getOrCreateTripExpensesRequest(
        userId,
        tripId,
        () =>
          getTripExpenses(
            tripId,
            idToken,
          ),
      )

    expensesRequest
      .then((result) => {
        if (!isActive) {
          return
        }

        setExpenses(
          Array.isArray(result)
            ? result
            : [],
        )

        setExpensesError('')
        setLoadedTripId(tripId)
      })
      .catch((error) => {
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
      })
      .finally(() => {
        releaseTripExpensesRequest(
          userId,
          tripId,
          expensesRequest,
        )
      })

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

      setExpenses(
        (currentExpenses) => [
          createdExpense,
          ...currentExpenses,
        ],
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
      !expenseId ||
      !idToken ||
      updatingExpenseId
    ) {
      return null
    }

    try {
      setUpdatingExpenseId(expenseId)
      setExpenseActionError('')

      const updatedExpense =
        await updateTripExpense(
          tripId,
          expenseId,
          expenseData,
          idToken,
        )

      setExpenses(
        (currentExpenses) =>
          currentExpenses.map(
            (expense) =>
              expense.id === expenseId
                ? updatedExpense
                : expense,
          ),
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
      !expenseId ||
      !idToken ||
      deletingExpenseId
    ) {
      return false
    }

    try {
      setDeletingExpenseId(expenseId)
      setExpenseActionError('')

      await deleteTripExpense(
        tripId,
        expenseId,
        idToken,
      )

      setExpenses(
        (currentExpenses) =>
          currentExpenses.filter(
            (expense) =>
              expense.id !== expenseId,
          ),
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

  const clearExpenseActionError = () => {
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