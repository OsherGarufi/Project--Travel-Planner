import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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

function EditIcon() {
  return (
    <svg
      className="trip-expenses__action-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg
      className="trip-expenses__action-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}

function TripExpensesSection({
  trip,
  isFocusMode = false,
  isHidden = false,
  onFocusStart,
  onFocusEnd,
}) {
  const expenseFormRef = useRef(null)

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

  const [
    isExpensesVisible,
    setIsExpensesVisible,
  ] = useState(false)

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('ALL')

  const [
    sortOption,
    setSortOption,
  ] = useState('DEFAULT')

  const [
    itemsPerPage,
    setItemsPerPage,
  ] = useState(5)

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

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

  const categories = useMemo(() => {
    const uniqueCategories =
      new Map()

    for (const expense of expenses) {
      const category =
        expense?.category?.trim()

      if (!category) {
        continue
      }

      const categoryKey =
        category.toLowerCase()

      if (
        !uniqueCategories.has(
          categoryKey,
        )
      ) {
        uniqueCategories.set(
          categoryKey,
          category,
        )
      }
    }

    return Array.from(
      uniqueCategories.values(),
    ).sort((categoryA, categoryB) =>
      categoryA.localeCompare(
        categoryB,
      ),
    )
  }, [expenses])

  const hasSelectedCategory =
    selectedCategory === 'ALL' ||
    categories.some(
      (category) =>
        category.toLowerCase() ===
        selectedCategory.toLowerCase(),
    )

  const activeCategory =
    hasSelectedCategory
      ? selectedCategory
      : 'ALL'

  const filteredExpenses =
    useMemo(() => {
      if (activeCategory === 'ALL') {
        return expenses
      }

      return expenses.filter(
        (expense) =>
          expense.category
            ?.trim()
            .toLowerCase() ===
          activeCategory.toLowerCase(),
      )
    }, [
      activeCategory,
      expenses,
    ])

  const sortedExpenses =
    useMemo(() => {
      if (
        sortOption === 'DEFAULT' ||
        !expenseSummary.canSortByAmount
      ) {
        return filteredExpenses
      }

      const sorted = [
        ...filteredExpenses,
      ]

      sorted.sort(
        (expenseA, expenseB) => {
          const amountA =
            expenseSummary
              .convertedAmountsByExpenseId
              .get(expenseA.id)

          const amountB =
            expenseSummary
              .convertedAmountsByExpenseId
              .get(expenseB.id)

          if (
            typeof amountA !== 'number' ||
            typeof amountB !== 'number'
          ) {
            return 0
          }

          if (
            sortOption ===
            'AMOUNT_DESC'
          ) {
            return amountB - amountA
          }

          return amountA - amountB
        },
      )

      return sorted
    }, [
      expenseSummary.canSortByAmount,
      expenseSummary
        .convertedAmountsByExpenseId,
      filteredExpenses,
      sortOption,
    ])

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedExpenses.length /
        itemsPerPage,
    ),
  )

  const activePage = Math.min(
    currentPage,
    totalPages,
  )

  const pageStartIndex =
    (activePage - 1) *
    itemsPerPage

  const paginatedExpenses =
    sortedExpenses.slice(
      pageStartIndex,
      pageStartIndex +
        itemsPerPage,
    )

  const resultStart =
    sortedExpenses.length > 0
      ? pageStartIndex + 1
      : 0

  const resultEnd =
    Math.min(
      pageStartIndex +
        itemsPerPage,
      sortedExpenses.length,
    )

  const existingCategories =
    expenses.map(
      (expense) => expense.category,
    )

  useEffect(() => {
    if (
      !isFocusMode ||
      (
        !isAddingExpense &&
        !editingExpense
      )
    ) {
      return
    }

    expenseFormRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [
    isFocusMode,
    isAddingExpense,
    editingExpense,
  ])

  const handleStartAdding = () => {
    clearExpenseActionError()

    setEditingExpense(null)

    setDeleteConfirmationExpenseId(
      null,
    )

    setIsAddingExpense(true)

    onFocusStart?.()
  }

  const handleCancelAdding = () => {
    clearExpenseActionError()
    setIsAddingExpense(false)

    onFocusEnd?.()
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

    onFocusEnd?.()
  }

  const handleStartEditing = (
    expense,
  ) => {
    clearExpenseActionError()

    setIsAddingExpense(false)

    setDeleteConfirmationExpenseId(
      null,
    )

    setEditingExpense(expense)

    onFocusStart?.()
  }

  const handleCancelEditing = () => {
    clearExpenseActionError()
    setEditingExpense(null)

    onFocusEnd?.()
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

    onFocusEnd?.()
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

  const handleCategoryChange = (
    event,
  ) => {
    setSelectedCategory(
      event.target.value,
    )

    setCurrentPage(1)
  }

  const handleSortChange = (
    event,
  ) => {
    setSortOption(
      event.target.value,
    )

    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (
    event,
  ) => {
    setItemsPerPage(
      Number(event.target.value),
    )

    setCurrentPage(1)
  }

  const handlePreviousPage = () => {
    setCurrentPage((page) =>
      Math.max(page - 1, 1),
    )
  }

  const handleNextPage = () => {
    setCurrentPage((page) =>
      Math.min(
        page + 1,
        totalPages,
      ),
    )
  }

  const handleClearFilter = () => {
    setSelectedCategory('ALL')
    setCurrentPage(1)
  }

  const isFormOpen =
    isAddingExpense ||
    Boolean(editingExpense)

  const hasActiveExpenseInteraction =
    isFormOpen ||
    Boolean(
      deleteConfirmationExpenseId,
    )

  const sectionClassName =
    isFocusMode
      ? 'trip-expenses trip-expenses--focus'
      : 'trip-expenses'

  return (
    <section
      className={sectionClassName}
      hidden={isHidden}
    >
      <div
        className="trip-expenses__normal-content"
        hidden={isFocusMode}
      >
        <div className="trip-expenses__top">
          <div className="trip-expenses__header">
            <div className="trip-expenses__header-copy">
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

            {!isLoadingExpenses &&
              !expensesError && (
                <div className="trip-expenses__header-actions">
                  {!hasActiveExpenseInteraction && (
                    <button
                      className="trip-expenses__add-button"
                      type="button"
                      onClick={
                        handleStartAdding
                      }
                    >
                      Add expense
                    </button>
                  )}

                  {expenses.length > 0 && (
                    <button
                      className="trip-expenses__view-button"
                      type="button"
                      onClick={() =>
                        setIsExpensesVisible(
                          (isVisible) =>
                            !isVisible,
                        )
                      }
                      aria-expanded={
                        isExpensesVisible
                      }
                    >
                      {isExpensesVisible
                        ? 'Hide expenses'
                        : `View expenses (${expenses.length})`}
                    </button>
                  )}
                </div>
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
        </div>

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
                onClick={
                  handleStartAdding
                }
              >
                Add your first expense
              </button>
            </div>
          )}

        {!isLoadingExpenses &&
          !expensesError &&
          expenses.length > 0 &&
          isExpensesVisible && (
            <div className="trip-expenses__browser">
              <div className="trip-expenses__controls">
                <div className="trip-expenses__controls-fields">
                  <div className="trip-expenses__filter">
                    <label
                      className="trip-expenses__filter-label"
                      htmlFor="expense-category-filter"
                    >
                      Category
                    </label>

                    <select
                      id="expense-category-filter"
                      className="trip-expenses__filter-select"
                      value={activeCategory}
                      onChange={
                        handleCategoryChange
                      }
                    >
                      <option value="ALL">
                        All categories
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="trip-expenses__filter">
                    <label
                      className="trip-expenses__filter-label"
                      htmlFor="expense-sort"
                    >
                      Sort by
                    </label>

                    <select
                      id="expense-sort"
                      className="trip-expenses__filter-select"
                      value={sortOption}
                      onChange={
                        handleSortChange
                      }
                    >
                      <option value="DEFAULT">
                        Default
                      </option>

                      <option
                        value="AMOUNT_DESC"
                        disabled={
                          !expenseSummary.canSortByAmount
                        }
                      >
                        High to low
                      </option>

                      <option
                        value="AMOUNT_ASC"
                        disabled={
                          !expenseSummary.canSortByAmount
                        }
                      >
                        Low to high
                      </option>
                    </select>
                  </div>

                  <div className="trip-expenses__filter trip-expenses__filter--per-page">
                    <label
                      className="trip-expenses__filter-label"
                      htmlFor="expense-page-size"
                    >
                      Per page
                    </label>

                    <select
                      id="expense-page-size"
                      className="trip-expenses__filter-select"
                      value={itemsPerPage}
                      onChange={
                        handleItemsPerPageChange
                      }
                    >
                      <option value={5}>
                        5
                      </option>

                      <option value={10}>
                        10
                      </option>

                      <option value={20}>
                        20
                      </option>
                    </select>
                  </div>
                </div>

                <p className="trip-expenses__results-count">
                  Showing{' '}
                  <strong>
                    {resultStart}
                    –
                    {resultEnd}
                  </strong>{' '}
                  of{' '}
                  <strong>
                    {sortedExpenses.length}
                  </strong>{' '}
                  expenses
                </p>
              </div>

              {paginatedExpenses.length >
              0 ? (
                <>
                  <div className="trip-expenses__items">
                    {paginatedExpenses.map(
                      (expense) => {
                        const isConfirmingDelete =
                          deleteConfirmationExpenseId ===
                          expense.id

                        const isDeletingThisExpense =
                          deletingExpenseId ===
                          expense.id

                        return (
                          <article
                            className={
                              isConfirmingDelete
                                ? 'trip-expenses__item trip-expenses__item--confirming'
                                : 'trip-expenses__item'
                            }
                            key={expense.id}
                          >
                            <div className="trip-expenses__item-main">
                              <span className="trip-expenses__item-category">
                                {
                                  expense.category
                                }
                              </span>

                              <h3 className="trip-expenses__item-title">
                                {
                                  expense.title
                                }
                              </h3>
                            </div>

                            <div className="trip-expenses__item-side">
                              <div className="trip-expenses__item-amount">
                                <strong>
                                  {
                                    expense.amount
                                  }
                                </strong>

                                <span>
                                  {
                                    expense.currency
                                  }
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
                                      {
                                        expenseActionError
                                      }
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
                                    aria-label={`Edit ${expense.title}`}
                                    title="Edit expense"
                                  >
                                    <EditIcon />

                                    <span className="trip-expenses__action-label">
                                      Edit
                                    </span>
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
                                    aria-label={`Delete ${expense.title}`}
                                    title="Delete expense"
                                  >
                                    <DeleteIcon />

                                    <span className="trip-expenses__action-label">
                                      Delete
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      },
                    )}
                  </div>

                  {totalPages > 1 && (
                    <nav
                      className="trip-expenses__pagination"
                      aria-label="Expenses pagination"
                    >
                      <button
                        className="trip-expenses__pagination-button"
                        type="button"
                        onClick={
                          handlePreviousPage
                        }
                        disabled={
                          activePage === 1
                        }
                      >
                        Previous
                      </button>

                      <div className="trip-expenses__pagination-pages">
                        {Array.from(
                          {
                            length:
                              totalPages,
                          },
                          (_, index) =>
                            index + 1,
                        ).map(
                          (pageNumber) => (
                            <button
                              key={
                                pageNumber
                              }
                              className={
                                pageNumber ===
                                activePage
                                  ? 'trip-expenses__pagination-page trip-expenses__pagination-page--active'
                                  : 'trip-expenses__pagination-page'
                              }
                              type="button"
                              onClick={() =>
                                setCurrentPage(
                                  pageNumber,
                                )
                              }
                              aria-current={
                                pageNumber ===
                                activePage
                                  ? 'page'
                                  : undefined
                              }
                            >
                              {pageNumber}
                            </button>
                          ),
                        )}
                      </div>

                      <button
                        className="trip-expenses__pagination-button"
                        type="button"
                        onClick={
                          handleNextPage
                        }
                        disabled={
                          activePage ===
                          totalPages
                        }
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </>
              ) : (
                <div className="trip-expenses__filtered-empty">
                  <p className="trip-expenses__filtered-empty-title">
                    No expenses in this category
                  </p>

                  <p className="trip-expenses__filtered-empty-description">
                    Choose another category or
                    return to all expenses.
                  </p>

                  <button
                    className="trip-expenses__clear-filter"
                    type="button"
                    onClick={
                      handleClearFilter
                    }
                  >
                    Show all expenses
                  </button>
                </div>
              )}
            </div>
          )}
      </div>

      {isAddingExpense && (
        <div
          ref={expenseFormRef}
          className="trip-expenses__focus-area"
        >
          <div className="trip-expenses__focus-heading">
            <p className="trip-expenses__focus-eyebrow">
              ADD EXPENSE
            </p>

            <h2 className="trip-expenses__focus-title">
              Add a trip expense
            </h2>

            <p className="trip-expenses__focus-description">
              Add a new expense and keep
              your trip spending organized.
            </p>
          </div>

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
            onSubmit={
              handleAddExpense
            }
            onCancel={
              handleCancelAdding
            }
          />
        </div>
      )}

      {editingExpense && (
        <div
          ref={expenseFormRef}
          className="trip-expenses__focus-area"
        >
          <div className="trip-expenses__focus-heading">
            <p className="trip-expenses__focus-eyebrow">
              EDIT EXPENSE
            </p>

            <h2 className="trip-expenses__focus-title">
              Update expense details
            </h2>

            <p className="trip-expenses__focus-description">
              Update the information
              for this trip expense.
            </p>
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
    </section>
  )
}

export default TripExpensesSection