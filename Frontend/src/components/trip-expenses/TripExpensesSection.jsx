import { useState } from 'react'
import '../../css/components/trip-expenses-section.css'
import { useExpenseSummary } from '../../hooks/trip-expenses/useExpenseSummary'
import { useTripExpenses } from '../../hooks/trip-expenses/useTripExpenses'
import ExpenseForm from './ExpenseForm'
import ExpenseSummary from './ExpenseSummary'

function TripExpensesLoadingState() {
  return (
    <div
      className="trip-expenses__loading"
      aria-hidden="true"
    >
      <span className="trip-expenses__loading-line trip-expenses__loading-line--title" />
      <span className="trip-expenses__loading-line trip-expenses__loading-line--medium" />

      <div className="trip-expenses__loading-items">
        <span className="trip-expenses__loading-item" />
        <span className="trip-expenses__loading-item" />
      </div>
    </div>
  )
}

function TripExpensesSection({ trip }) {
  const [
    isAddingExpense,
    setIsAddingExpense,
  ] = useState(false)

  const [
    editingExpense,
    setEditingExpense,
  ] = useState(null)

  const [
    deleteConfirmationExpenseId,
    setDeleteConfirmationExpenseId,
  ] = useState(null)

  const {
    expenses,
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
  } = useTripExpenses(trip?.id)

  const expenseSummary =
    useExpenseSummary({
      expenses,
      budgetAmount:
        trip?.budgetAmount,
      budgetCurrency:
        trip?.budgetCurrency,
    })

  const existingCategories =
    expenses.map(
      (expense) => expense.category,
    )

  const handleStartAdding = () => {
    clearExpenseActionError()
    setEditingExpense(null)
    setDeleteConfirmationExpenseId(null)
    setIsAddingExpense(true)
  }

  const handleCancelAdding = () => {
    clearExpenseActionError()
    setIsAddingExpense(false)
  }

  const handleAddExpense = async (
    expenseData,
  ) => {
    const createdExpense =
      await addExpense(expenseData)

    if (!createdExpense) {
      return
    }

    setIsAddingExpense(false)
  }

  const handleStartEditing = (
    expense,
  ) => {
    clearExpenseActionError()
    setIsAddingExpense(false)
    setDeleteConfirmationExpenseId(null)
    setEditingExpense(expense)
  }

  const handleCancelEditing = () => {
    clearExpenseActionError()
    setEditingExpense(null)
  }

  const handleEditExpense = async (
    expenseData,
  ) => {
    if (!editingExpense?.id) {
      return
    }

    const updatedExpense =
      await editExpense(
        editingExpense.id,
        expenseData,
      )

    if (!updatedExpense) {
      return
    }

    setEditingExpense(null)
  }

  const handleStartDeleting = (
    expenseId,
  ) => {
    clearExpenseActionError()
    setIsAddingExpense(false)
    setEditingExpense(null)

    setDeleteConfirmationExpenseId(
      expenseId,
    )
  }

  const handleCancelDeleting = () => {
    clearExpenseActionError()

    setDeleteConfirmationExpenseId(
      null,
    )
  }

  const handleDeleteExpense = async (
    expenseId,
  ) => {
    const wasDeleted =
      await removeExpense(expenseId)

    if (!wasDeleted) {
      return
    }

    setDeleteConfirmationExpenseId(
      null,
    )
  }

  const isFormOpen =
    isAddingExpense ||
    Boolean(editingExpense)

  const hasActiveExpenseInteraction =
    isFormOpen ||
    Boolean(
      deleteConfirmationExpenseId,
    )

  return (
    <section className="trip-expenses">
      <div className="trip-expenses__header">
        <div>
          <p className="trip-expenses__eyebrow">
            EXPENSES
          </p>

          <h2 className="trip-expenses__title">
            Trip expenses
          </h2>

          <p className="trip-expenses__description">
            Keep all of your trip spending
            organized in one place.
          </p>
        </div>

        {!hasActiveExpenseInteraction &&
          !isLoadingExpenses &&
          !expensesError && (
            <button
              className="trip-expenses__add-button"
              type="button"
              onClick={handleStartAdding}
            >
              Add expense
            </button>
          )}
      </div>

      {!isLoadingExpenses &&
        !expensesError && (
          <ExpenseSummary
            status={
              expenseSummary.status
            }
            currency={
              expenseSummary.currency
            }
            hasExpenses={
              expenseSummary.hasExpenses
            }
            hasBudget={
              expenseSummary.hasBudget
            }
            budgetAmount={
              expenseSummary.budgetAmount
            }
            spentAmount={
              expenseSummary.spentAmount
            }
            remainingAmount={
              expenseSummary.remainingAmount
            }
            percentageUsed={
              expenseSummary.percentageUsed
            }
            isEstimated={
              expenseSummary.isEstimated
            }
          />
        )}

      {isAddingExpense && (
        <ExpenseForm
          key="add-expense"
          defaultCurrency={
            trip?.budgetCurrency ?? 'ILS'
          }
          existingCategories={
            existingCategories
          }
          isSubmitting={
            isCreatingExpense
          }
          submitError={
            expenseActionError
          }
          onSubmit={handleAddExpense}
          onCancel={handleCancelAdding}
        />
      )}

      {editingExpense && (
        <div className="trip-expenses__edit-area">
          <div className="trip-expenses__edit-heading">
            <p className="trip-expenses__edit-eyebrow">
              EDIT EXPENSE
            </p>

            <h3 className="trip-expenses__edit-title">
              Update expense details
            </h3>
          </div>

          <ExpenseForm
            key={editingExpense.id}
            initialExpense={
              editingExpense
            }
            defaultCurrency={
              trip?.budgetCurrency ?? 'ILS'
            }
            existingCategories={
              existingCategories
            }
            isSubmitting={
              updatingExpenseId ===
              editingExpense.id
            }
            submitError={
              expenseActionError
            }
            onSubmit={
              handleEditExpense
            }
            onCancel={
              handleCancelEditing
            }
          />
        </div>
      )}

      {isLoadingExpenses && (
        <TripExpensesLoadingState />
      )}

      {!isLoadingExpenses &&
        expensesError && (
          <div
            className="trip-expenses__error"
            role="alert"
          >
            <div>
              <p className="trip-expenses__error-title">
                Expenses unavailable
              </p>

              <p className="trip-expenses__error-description">
                {expensesError}
              </p>
            </div>

            <button
              className="trip-expenses__retry-button"
              type="button"
              onClick={reloadExpenses}
            >
              Try again
            </button>
          </div>
        )}

      {!isLoadingExpenses &&
        !expensesError &&
        expenses.length === 0 &&
        !isFormOpen && (
          <div className="trip-expenses__empty">
            <div
              className="trip-expenses__empty-icon"
              aria-hidden="true"
            >
              $
            </div>

            <h3 className="trip-expenses__empty-title">
              No expenses yet
            </h3>

            <p className="trip-expenses__empty-description">
              Add your first expense to start
              keeping track of your trip
              spending.
            </p>

            <button
              className="trip-expenses__empty-button"
              type="button"
              onClick={handleStartAdding}
            >
              Add your first expense
            </button>
          </div>
        )}

      {!isLoadingExpenses &&
        !expensesError &&
        expenses.length > 0 && (
          <div className="trip-expenses__items">
            {expenses.map((expense) => {
              const isConfirmingDelete =
                deleteConfirmationExpenseId ===
                expense.id

              const isDeletingThisExpense =
                deletingExpenseId ===
                expense.id

              return (
                <article
                  className="trip-expenses__item"
                  key={expense.id}
                >
                  <div className="trip-expenses__item-main">
                    <span className="trip-expenses__item-category">
                      {expense.category}
                    </span>

                    <h3 className="trip-expenses__item-title">
                      {expense.title}
                    </h3>
                  </div>

                  <div className="trip-expenses__item-side">
                    <div className="trip-expenses__item-amount">
                      <strong>
                        {expense.amount}
                      </strong>

                      <span>
                        {expense.currency}
                      </span>
                    </div>

                    {isConfirmingDelete ? (
                      <div className="trip-expenses__delete-confirmation">
                        <p className="trip-expenses__delete-message">
                          Delete this expense?
                        </p>

                        {expenseActionError && (
                          <p
                            className="trip-expenses__delete-error"
                            role="alert"
                          >
                            {expenseActionError}
                          </p>
                        )}

                        <div className="trip-expenses__delete-actions">
                          <button
                            className="trip-expenses__delete-cancel"
                            type="button"
                            onClick={
                              handleCancelDeleting
                            }
                            disabled={
                              isDeletingThisExpense
                            }
                          >
                            Cancel
                          </button>

                          <button
                            className="trip-expenses__delete-confirm"
                            type="button"
                            onClick={() =>
                              handleDeleteExpense(
                                expense.id,
                              )
                            }
                            disabled={
                              isDeletingThisExpense
                            }
                          >
                            {isDeletingThisExpense
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="trip-expenses__item-actions">
                        <button
                          className="trip-expenses__edit-button"
                          type="button"
                          onClick={() =>
                            handleStartEditing(
                              expense,
                            )
                          }
                          disabled={
                            hasActiveExpenseInteraction ||
                            Boolean(
                              deletingExpenseId,
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="trip-expenses__delete-button"
                          type="button"
                          onClick={() =>
                            handleStartDeleting(
                              expense.id,
                            )
                          }
                          disabled={
                            hasActiveExpenseInteraction ||
                            Boolean(
                              deletingExpenseId,
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
    </section>
  )
}

export default TripExpensesSection