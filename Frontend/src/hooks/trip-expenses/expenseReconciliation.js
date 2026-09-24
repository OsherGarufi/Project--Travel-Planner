export function reconcileExpenseItemsForTripDateRange(
  expenses,
  startDate,
  endDate,
) {
  let hasReconciledExpense = false

  const reconciledExpenses =
    expenses.map((expense) => {
      if (
        !expense.itineraryItemId ||
        !expense.itineraryDate ||
        (expense.itineraryDate >= startDate &&
          expense.itineraryDate <= endDate)
      ) {
        return expense
      }

      hasReconciledExpense = true

      return {
        ...expense,
        itineraryDate: null,
        startTime: null,
        endTime: null,
      }
    })

  return hasReconciledExpense
    ? reconciledExpenses
    : expenses
}

export function createExpensePayload(
  entryData,
) {
  return {
    category: entryData.category,
    title: entryData.title,
    amount: entryData.amount,
    currency: entryData.currency,
    referenceUrl: entryData.referenceUrl,
    notes: entryData.description,
  }
}

export function createItineraryPayload(
  entryData,
) {
  return {
    title: entryData.title,
    category: entryData.category,
    itineraryDate: entryData.itineraryDate,
    startTime: entryData.startTime,
    endTime: entryData.endTime,
    description: entryData.description,
    referenceUrl: entryData.referenceUrl,
    cost: entryData.amount,
    currency: entryData.currency,
  }
}

export function prependExpense(
  expenses,
  expense,
) {
  return [expense, ...expenses]
}

export function replaceExpense(
  expenses,
  expenseId,
  replacementExpense,
) {
  return expenses.map((expense) =>
    expense.id === expenseId
      ? replacementExpense
      : expense,
  )
}

export function removeExpenseById(
  expenses,
  expenseId,
) {
  return expenses.filter(
    (expense) => expense.id !== expenseId,
  )
}
