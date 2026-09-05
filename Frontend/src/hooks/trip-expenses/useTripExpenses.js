import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  clearCachedTripExpenses,
  getCachedTripExpenses,
  getTripExpensesCacheKey,
  setCachedTripExpenses,
  syncCachedTripExpensesFromStorage,
} from '../../services/expenseCacheService'
import {
  createTripExpense,
  deleteTripExpense,
  getTripExpenses,
  updateTripExpense,
} from '../../services/expenseService'
import {
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
  deleteTripItineraryItem,
  updateTripItineraryItem,
} from '../../services/itinerary/itineraryService'
import {
  getOrCreateTripExpensesRequest,
  releaseTripExpensesRequest,
} from '../../services/trips/tripsRequestManager'
import { useAuth } from '../useAuth'

const EXPENSE_ENTRY_TYPES = {
  SCHEDULED: 'scheduled',
  PLAN_LATER: 'plan-later',
  ONLY_EXPENSE: 'only-expense',
}

export function useTripExpenses(
  tripId,
) {
  const {
    firebaseUser,
    idToken,
  } = useAuth()

  const userId =
    firebaseUser?.uid ?? null

  const expensesContextKey =
    userId && tripId
      ? `${userId}:${tripId}`
      : null

  const [
    expenses,
    setExpenses,
  ] = useState([])

  const expensesRef =
    useRef([])

  const [
    loadedContextKey,
    setLoadedContextKey,
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

    setExpenses(
      nextExpenses,
    )

    if (
      userId &&
      tripId
    ) {
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
      !idToken ||
      !expensesContextKey
    ) {
      expensesRef.current = []

      setExpenses([])
      setLoadedContextKey(null)
      setExpensesError('')

      return undefined
    }

    let isActive = true
    let expensesRequest = null

    const loadExpenses =
      async () => {
        await Promise.resolve()

        if (!isActive) {
          return
        }

        const cachedExpenses =
          getCachedTripExpenses(
            userId,
            tripId,
          )

        if (
          Array.isArray(
            cachedExpenses,
          )
        ) {
          expensesRef.current =
            cachedExpenses

          setExpenses(
            cachedExpenses,
          )

          setExpensesError('')

          setLoadedContextKey(
            expensesContextKey,
          )

          return
        }

        expensesRef.current = []

        setExpenses([])
        setLoadedContextKey(null)
        setExpensesError('')

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

          setLoadedContextKey(
            expensesContextKey,
          )
        } catch (error) {
          if (!isActive) {
            return
          }

          console.error(
            'Failed to load trip expenses:',
            error,
          )

          expensesRef.current = []

          setExpenses([])

          setExpensesError(
            'Could not load trip expenses. Please try again.',
          )

          setLoadedContextKey(
            expensesContextKey,
          )
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
      loadedContextKey !==
        expensesContextKey
    ) {
      return undefined
    }

    const cacheKey =
      getTripExpensesCacheKey(
        userId,
        tripId,
      )

    const handleStorageChange = (
      event,
    ) => {
      if (
        event.storageArea !==
          localStorage ||
        event.key !== cacheKey ||
        !event.newValue
      ) {
        return
      }

      const nextExpenses =
        syncCachedTripExpensesFromStorage(
          userId,
          tripId,
          event.newValue,
        )

      if (
        !Array.isArray(
          nextExpenses,
        )
      ) {
        return
      }

      expensesRef.current =
        nextExpenses

      setExpenses(
        nextExpenses,
      )

      setExpensesError('')
    }

    window.addEventListener(
      'storage',
      handleStorageChange,
    )

    return () => {
      window.removeEventListener(
        'storage',
        handleStorageChange,
      )
    }
  }, [
    userId,
    tripId,
    expensesContextKey,
    loadedContextKey,
  ])

  const hasExpensesContext =
    Boolean(
      tripId &&
      userId &&
      idToken &&
      expensesContextKey,
    )

  const isLoadingExpenses =
    Boolean(
      hasExpensesContext &&
      loadedContextKey !==
        expensesContextKey,
    )

  const visibleExpenses =
    hasExpensesContext &&
    loadedContextKey ===
      expensesContextKey
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
    setLoadedContextKey(null)

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
      loadedContextKey !==
        expensesContextKey ||
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

      if (!createdExpense?.id) {
        throw new Error(
          'Invalid expense response.',
        )
      }

      const nextExpenses = [
        createdExpense,
        ...expensesRef.current,
      ]

      applyExpenses(
        nextExpenses,
      )

      syncItineraryCacheFromExpense(
        userId,
        tripId,
        createdExpense,
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

  const addExpenseActivity =
    async (itemData) => {
      if (
        !tripId ||
        !userId ||
        !idToken ||
        loadedContextKey !==
          expensesContextKey ||
        isCreatingExpense
      ) {
        return null
      }

      try {
        setIsCreatingExpense(true)
        setExpenseActionError('')

        const createdItem =
          await createTripItineraryItem(
            tripId,
            itemData,
            idToken,
          )

        if (
          !createdItem?.id ||
          !createdItem?.expenseId
        ) {
          throw new Error(
            'Invalid linked activity response.',
          )
        }

        const cachedItineraryItems =
          getTripItineraryCache(
            userId,
            tripId,
          )

        if (
          Array.isArray(
            cachedItineraryItems,
          )
        ) {
          const hasCreatedItem =
            cachedItineraryItems.some(
              (item) =>
                item.id ===
                createdItem.id,
            )

          const nextItineraryItems =
            hasCreatedItem
              ? cachedItineraryItems.map(
                  (item) =>
                    item.id ===
                    createdItem.id
                      ? createdItem
                      : item,
                )
              : [
                  ...cachedItineraryItems,
                  createdItem,
                ]

          setTripItineraryCache(
            userId,
            tripId,
            nextItineraryItems,
          )
        }

        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          createdItem,
        )

        const nextExpenses =
          getCachedTripExpenses(
            userId,
            tripId,
          )

        if (
          !Array.isArray(
            nextExpenses,
          )
        ) {
          throw new Error(
            'Could not synchronize the expense cache.',
          )
        }

        expensesRef.current =
          nextExpenses

        setExpenses(
          nextExpenses,
        )

        return createdItem
      } catch (error) {
        console.error(
          'Failed to create linked trip activity:',
          error,
        )

        setExpenseActionError(
          'Could not add the trip item. Please try again.',
        )

        return null
      } finally {
        setIsCreatingExpense(false)
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
      loadedContextKey !==
        expensesContextKey ||
      updatingExpenseId
    ) {
      return null
    }

    const currentExpense =
      expensesRef.current.find(
        (expense) =>
          expense.id ===
          expenseId,
      ) ?? null

    if (!currentExpense) {
      return null
    }

    const currentIsLinked =
      Boolean(
        currentExpense
          .itineraryItemId,
      )

    const targetIsOnlyExpense =
      entryData.entryType ===
      EXPENSE_ENTRY_TYPES
        .ONLY_EXPENSE

    const targetIsLinked =
      entryData.entryType ===
        EXPENSE_ENTRY_TYPES
          .SCHEDULED ||
      entryData.entryType ===
        EXPENSE_ENTRY_TYPES
          .PLAN_LATER

    if (
      !targetIsOnlyExpense &&
      !targetIsLinked
    ) {
      return null
    }

    const expenseData = {
      category:
        entryData.category,

      title:
        entryData.title,

      amount:
        entryData.amount,

      currency:
        entryData.currency,

      referenceUrl:
        entryData.referenceUrl,

      notes:
        entryData.description,
    }

    const itineraryData = {
      title:
        entryData.title,

      category:
        entryData.category,

      itineraryDate:
        entryData.itineraryDate,

      startTime:
        entryData.startTime,

      endTime:
        entryData.endTime,

      description:
        entryData.description,

      referenceUrl:
        entryData.referenceUrl,

      cost:
        entryData.amount,

      currency:
        entryData.currency,
    }

    const updateCachedItineraryItem = (
      updatedItem,
    ) => {
      const cachedItems =
        getTripItineraryCache(
          userId,
          tripId,
        )

      if (
        !Array.isArray(
          cachedItems,
        )
      ) {
        return
      }

      const itemExists =
        cachedItems.some(
          (item) =>
            item.id ===
            updatedItem.id,
        )

      const nextItems =
        itemExists
          ? cachedItems.map(
              (item) =>
                item.id ===
                updatedItem.id
                  ? updatedItem
                  : item,
            )
          : [
              ...cachedItems,
              updatedItem,
            ]

      setTripItineraryCache(
        userId,
        tripId,
        nextItems,
      )
    }

    const removeCachedItineraryItem = (
      itemId,
    ) => {
      const cachedItems =
        getTripItineraryCache(
          userId,
          tripId,
        )

      if (
        !Array.isArray(
          cachedItems,
        )
      ) {
        return
      }

      setTripItineraryCache(
        userId,
        tripId,
        cachedItems.filter(
          (item) =>
            item.id !== itemId,
        ),
      )
    }

    try {
      setUpdatingExpenseId(
        expenseId,
      )

      setExpenseActionError('')

      /*
       * Expense only -> Expense only
       *
       * No relationship change is needed, so the normal
       * Expense PUT is the correct and smallest mutation.
       */
      if (
        !currentIsLinked &&
        targetIsOnlyExpense
      ) {
        const updatedExpense =
          await updateTripExpense(
            tripId,
            expenseId,
            expenseData,
            idToken,
          )

        if (!updatedExpense?.id) {
          throw new Error(
            'Invalid expense response.',
          )
        }

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
      }

      /*
       * Linked Expense -> Scheduled / Plan later
       *
       * The itinerary PUT already updates the Activity and its
       * linked Expense together in one backend transaction.
       * This also applies the requested scheduling state.
       */
      if (
        currentIsLinked &&
        targetIsLinked
      ) {
        const cachedItems =
          getTripItineraryCache(
            userId,
            tripId,
          )

        const previousItem =
          Array.isArray(
            cachedItems,
          )
            ? cachedItems.find(
                (item) =>
                  item.id ===
                  currentExpense
                    .itineraryItemId,
              ) ?? null
            : null

        const updatedItem =
          await updateTripItineraryItem(
            tripId,
            currentExpense
              .itineraryItemId,
            itineraryData,
            idToken,
          )

        if (
          !updatedItem?.id ||
          !updatedItem?.expenseId
        ) {
          throw new Error(
            'Invalid linked activity response.',
          )
        }

        updateCachedItineraryItem(
          updatedItem,
        )

        syncExpensesCacheFromItineraryItem(
          userId,
          tripId,
          updatedItem,
          previousItem,
        )

        const syncedExpenses =
          getCachedTripExpenses(
            userId,
            tripId,
          )

        if (
          !Array.isArray(
            syncedExpenses,
          )
        ) {
          throw new Error(
            'Could not synchronize the expense cache.',
          )
        }

        expensesRef.current =
          syncedExpenses

        setExpenses(
          syncedExpenses,
        )

        return (
          syncedExpenses.find(
            (expense) =>
              expense.id ===
              updatedItem.expenseId,
          ) ?? null
        )
      }

      /*
       * Linked Expense -> Only expense
       *
       * With the existing API contract, deleting a paid
       * itinerary item also deletes its linked Expense.
       * Therefore create the replacement unlinked Expense
       * first, then delete the old linked pair. If the second
       * request fails, remove the replacement as a rollback.
       */
      if (
        currentIsLinked &&
        targetIsOnlyExpense
      ) {
        const replacementExpense =
          await createTripExpense(
            tripId,
            expenseData,
            idToken,
          )

        if (
          !replacementExpense?.id
        ) {
          throw new Error(
            'Invalid replacement expense response.',
          )
        }

        try {
          await deleteTripItineraryItem(
            tripId,
            currentExpense
              .itineraryItemId,
            idToken,
          )
        } catch (error) {
          try {
            await deleteTripExpense(
              tripId,
              replacementExpense.id,
              idToken,
            )
          } catch (rollbackError) {
            console.error(
              'Failed to roll back replacement expense:',
              rollbackError,
            )
          }

          throw error
        }

        removeCachedItineraryItem(
          currentExpense
            .itineraryItemId,
        )

        const nextExpenses =
          expensesRef.current.map(
            (expense) =>
              expense.id ===
              expenseId
                ? replacementExpense
                : expense,
          )

        applyExpenses(
          nextExpenses,
        )

        return replacementExpense
      }

      /*
       * Only expense -> Scheduled / Plan later
       *
       * Creating a paid itinerary item creates a new linked
       * Expense transactionally. Once that succeeds, remove
       * the old unlinked Expense. If removing the old Expense
       * fails, delete the newly-created itinerary item to roll
       * back the new linked pair.
       */
      const createdItem =
        await createTripItineraryItem(
          tripId,
          itineraryData,
          idToken,
        )

      if (
        !createdItem?.id ||
        !createdItem?.expenseId
      ) {
        throw new Error(
          'Invalid linked activity response.',
        )
      }

      try {
        await deleteTripExpense(
          tripId,
          expenseId,
          idToken,
        )
      } catch (error) {
        try {
          await deleteTripItineraryItem(
            tripId,
            createdItem.id,
            idToken,
          )
        } catch (rollbackError) {
          console.error(
            'Failed to roll back linked activity:',
            rollbackError,
          )
        }

        throw error
      }

      updateCachedItineraryItem(
        createdItem,
      )

      syncExpensesCacheFromItineraryItem(
        userId,
        tripId,
        createdItem,
      )

      const syncedExpenses =
        getCachedTripExpenses(
          userId,
          tripId,
        )

      if (
        !Array.isArray(
          syncedExpenses,
        )
      ) {
        throw new Error(
          'Could not synchronize the expense cache.',
        )
      }

      const nextExpenses =
        syncedExpenses.filter(
          (expense) =>
            expense.id !==
            expenseId,
        )

      applyExpenses(
        nextExpenses,
      )

      return (
        nextExpenses.find(
          (expense) =>
            expense.id ===
            createdItem.expenseId,
        ) ?? null
      )
    } catch (error) {
      console.error(
        'Failed to update trip expense entry:',
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
    deleteLinkedActivity = null,
  ) => {
    if (
      !tripId ||
      !userId ||
      !expenseId ||
      !idToken ||
      loadedContextKey !==
        expensesContextKey ||
      deletingExpenseId
    ) {
      return false
    }

    const expenseToDelete =
      expensesRef.current.find(
        (expense) =>
          expense.id ===
          expenseId,
      )

    try {
      setDeletingExpenseId(
        expenseId,
      )

      setExpenseActionError('')

      await deleteTripExpense(
        tripId,
        expenseId,
        idToken,
        deleteLinkedActivity,
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
    expenses:
      visibleExpenses,

    isLoadingExpenses,
    expensesError,
    expenseActionError,

    isCreatingExpense,
    updatingExpenseId,
    deletingExpenseId,

    reloadExpenses,

    addExpense,
    addExpenseActivity,

    editExpenseEntry,
    removeExpense,

    clearExpenseActionError,
  }
}