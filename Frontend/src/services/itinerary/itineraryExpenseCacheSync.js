import {
    getCachedTripExpenses,
    setCachedTripExpenses,
} from '../expenseCacheService'
import {
    getTripItineraryCache,
    setTripItineraryCache,
} from './itineraryCache'

function createItineraryItemFromExpense(
  expense,
  existingItem,
  tripId,
) {
  return {
    ...existingItem,

    id:
      expense.itineraryItemId,

    tripId:
      expense.tripId ||
      tripId,

    expenseId:
      expense.id,

    title:
      expense.title,

    description:
      expense.notes ?? null,

    category:
      expense.category,

    itineraryDate:
      expense.itineraryDate ??
      null,

    startTime:
      expense.startTime ??
      null,

    endTime:
      expense.endTime ??
      null,

    referenceUrl:
      expense.referenceUrl ??
      null,

    cost:
      expense.amount,

    currency:
      expense.currency,

    createdAt:
      existingItem?.createdAt ??
      expense.createdAt,

    updatedAt:
      expense.updatedAt ??
      existingItem?.updatedAt ??
      expense.createdAt,
  }
}

function createExpenseFromItineraryItem(
  item,
  existingExpense,
  tripId,
) {
  return {
    ...existingExpense,

    id:
      item.expenseId,

    tripId:
      item.tripId ||
      tripId,

    itineraryItemId:
      item.id,

    category:
      item.category,

    title:
      item.title,

    amount:
      item.cost,

    currency:
      item.currency,

    referenceUrl:
      item.referenceUrl ??
      null,

    notes:
      item.description ??
      null,

    itineraryDate:
      item.itineraryDate ??
      null,

    startTime:
      item.startTime ??
      null,

    endTime:
      item.endTime ??
      null,

    createdAt:
      existingExpense?.createdAt ??
      item.createdAt,

    updatedAt:
      item.updatedAt ??
      existingExpense?.updatedAt ??
      item.createdAt,
  }
}

/**
 * Synchronizes a linked itinerary item after an
 * Expense create/update.
 *
 * If the itinerary cache does not already exist,
 * nothing is created. We never create a partial
 * trip itinerary cache from one Expense.
 */
export function syncItineraryCacheFromExpense(
  userId,
  tripId,
  expense,
) {
  if (
    !userId ||
    !tripId ||
    !expense?.id ||
    !expense?.itineraryItemId
  ) {
    return
  }

  const cachedItems =
    getTripItineraryCache(
      userId,
      tripId,
    )

  if (!cachedItems) {
    return
  }

  const existingItem =
    cachedItems.find(
      (item) =>
        item.id ===
        expense.itineraryItemId,
    )

  const syncedItem =
    createItineraryItemFromExpense(
      expense,
      existingItem,
      tripId,
    )

  const nextItems =
    existingItem
      ? cachedItems.map(
          (item) =>
            item.id ===
            expense.itineraryItemId
              ? syncedItem
              : item,
        )
      : [
          ...cachedItems,
          syncedItem,
        ]

  setTripItineraryCache(
    userId,
    tripId,
    nextItems,
  )
}

/**
 * Synchronizes the itinerary cache after a linked
 * Expense is deleted.
 *
 * deleteLinkedActivity = false:
 * Expense disappears, Activity remains free.
 *
 * deleteLinkedActivity = true:
 * Both Expense and Activity disappear.
 */
export function syncItineraryCacheAfterExpenseDelete(
  userId,
  tripId,
  expense,
  deleteLinkedActivity,
) {
  if (
    !userId ||
    !tripId ||
    !expense?.itineraryItemId
  ) {
    return
  }

  const cachedItems =
    getTripItineraryCache(
      userId,
      tripId,
    )

  if (!cachedItems) {
    return
  }

  if (
    deleteLinkedActivity ===
    true
  ) {
    const nextItems =
      cachedItems.filter(
        (item) =>
          item.id !==
          expense.itineraryItemId,
      )

    setTripItineraryCache(
      userId,
      tripId,
      nextItems,
    )

    return
  }

  if (
    deleteLinkedActivity ===
    false
  ) {
    const nextItems =
      cachedItems.map(
        (item) => {
          if (
            item.id !==
            expense.itineraryItemId
          ) {
            return item
          }

          return {
            ...item,
            expenseId: null,
            cost: null,
            currency: null,
          }
        },
      )

    setTripItineraryCache(
      userId,
      tripId,
      nextItems,
    )
  }
}

/**
 * Synchronizes Expenses cache after an itinerary
 * item create/update/schedule mutation.
 *
 * The itinerary item id is the stable relationship
 * key. This lets us remove stale cached Expense rows
 * even if an older cache contains a previous Expense
 * id for the same Activity.
 *
 * previousItem is still used as an additional direct
 * id fallback when the relationship changes.
 *
 * If the Expenses cache does not already exist,
 * nothing is created. This avoids building a partial
 * Expenses cache from one itinerary item.
 */
export function syncExpensesCacheFromItineraryItem(
  userId,
  tripId,
  item,
  previousItem = null,
) {
  if (
    !userId ||
    !tripId ||
    !item?.id
  ) {
    return
  }

  const cachedExpenses =
    getCachedTripExpenses(
      userId,
      tripId,
    )

  if (!cachedExpenses) {
    return
  }

  const previousExpenseId =
    previousItem?.expenseId ??
    null

  const currentExpenseId =
    item.expenseId ??
    null

  /*
   * Paid -> Free
   *
   * The backend deleted the linked Expense and the
   * updated itinerary item no longer has expenseId.
   *
   * Do not rely only on previousExpenseId here.
   * Remove every cached Expense that points to this
   * Activity as well. This also cleans old ghost rows.
   */
  if (!currentExpenseId) {
    const nextExpenses =
      cachedExpenses.filter(
        (expense) =>
          expense.id !==
            previousExpenseId &&
          expense.itineraryItemId !==
            item.id,
      )

    if (
      nextExpenses.length ===
      cachedExpenses.length
    ) {
      return
    }

    setCachedTripExpenses(
      userId,
      tripId,
      nextExpenses,
    )

    return
  }

  const existingExpense =
    cachedExpenses.find(
      (expense) =>
        expense.id ===
        currentExpenseId,
    ) ?? null

  const syncedExpense =
    createExpenseFromItineraryItem(
      item,
      existingExpense,
      tripId,
    )

  /*
   * Free -> Paid / Paid -> Paid
   *
   * Keep the current Expense only.
   *
   * Any other cached Expense pointing to the same
   * itinerary item is stale and must disappear.
   */
  const cleanedExpenses =
    cachedExpenses.filter(
      (expense) => {
        if (
          expense.id ===
          currentExpenseId
        ) {
          return true
        }

        if (
          previousExpenseId &&
          expense.id ===
            previousExpenseId
        ) {
          return false
        }

        if (
          expense.itineraryItemId ===
          item.id
        ) {
          return false
        }

        return true
      },
    )

  const hasCurrentExpense =
    cleanedExpenses.some(
      (expense) =>
        expense.id ===
        currentExpenseId,
    )

  const nextExpenses =
    hasCurrentExpense
      ? cleanedExpenses.map(
          (expense) =>
            expense.id ===
            currentExpenseId
              ? syncedExpense
              : expense,
        )
      : [
          syncedExpense,
          ...cleanedExpenses,
        ]

  setCachedTripExpenses(
    userId,
    tripId,
    nextExpenses,
  )
}

/**
 * Removes the linked Expense from an existing
 * Expenses cache after an itinerary item is deleted.
 *
 * We remove by both Expense id and itinerary item id
 * so an older duplicate cache row cannot survive.
 */
export function syncExpensesCacheAfterItineraryDelete(
  userId,
  tripId,
  item,
) {
  if (
    !userId ||
    !tripId ||
    !item?.id
  ) {
    return
  }

  const cachedExpenses =
    getCachedTripExpenses(
      userId,
      tripId,
    )

  if (!cachedExpenses) {
    return
  }

  const nextExpenses =
    cachedExpenses.filter(
      (expense) =>
        expense.id !==
          item.expenseId &&
        expense.itineraryItemId !==
          item.id,
    )

  if (
    nextExpenses.length ===
    cachedExpenses.length
  ) {
    return
  }

  setCachedTripExpenses(
    userId,
    tripId,
    nextExpenses,
  )
}