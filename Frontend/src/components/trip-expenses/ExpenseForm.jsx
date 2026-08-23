import { useMemo, useState } from 'react'
import '../../css/components/expense-form.css'
import CurrencySelector from '../currency/CurrencySelector'

const BUILT_IN_CATEGORIES = [
  'Flights',
  'Accommodation',
  'Food',
  'Transportation',
  'Activities',
  'Shopping',
  'Insurance',
  'Other',
]

function isValidHttpUrl(value) {
  if (!value.trim()) {
    return true
  }

  try {
    const url = new URL(value.trim())

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    )
  } catch {
    return false
  }
}

function normalizeExpenseData({
  category,
  title,
  amount,
  currency,
  expenseDate,
  referenceUrl,
  notes,
}) {
  return {
    category: category.trim(),
    title: title.trim(),
    amount: Number(amount),
    currency: currency.trim().toUpperCase(),
    expenseDate: expenseDate || null,
    referenceUrl:
      referenceUrl?.trim() || null,
    notes: notes?.trim() || null,
  }
}

function ExpenseForm({
  initialExpense = null,
  defaultCurrency = 'ILS',
  existingCategories = [],
  isSubmitting = false,
  submitError = '',
  onSubmit,
  onCancel,
}) {
  const isEditing =
    Boolean(initialExpense?.id)

  const initialCategory =
    initialExpense?.category ?? ''

  const categoryOptions = useMemo(() => {
    const customCategories = [
      ...existingCategories,
      initialCategory,
    ]
      .map((category) =>
        typeof category === 'string'
          ? category.trim()
          : '',
      )
      .filter(Boolean)
      .filter(
        (category) =>
          !BUILT_IN_CATEGORIES.some(
            (builtInCategory) =>
              builtInCategory.toLowerCase() ===
              category.toLowerCase(),
          ),
      )

    return [
      ...BUILT_IN_CATEGORIES,
      ...Array.from(
        new Map(
          customCategories.map(
            (category) => [
              category.toLowerCase(),
              category,
            ],
          ),
        ).values(),
      ),
    ]
  }, [
    existingCategories,
    initialCategory,
  ])

  const initialCategoryOption =
    categoryOptions.some(
      (category) =>
        category.toLowerCase() ===
        initialCategory.toLowerCase(),
    )
      ? initialCategory
      : ''

  const [categoryOption, setCategoryOption] =
    useState(initialCategoryOption)

  const [customCategory, setCustomCategory] =
    useState('')

  const [title, setTitle] = useState(
    initialExpense?.title ?? '',
  )

  const [amount, setAmount] = useState(
    initialExpense?.amount ?? '',
  )

  const [currency, setCurrency] =
    useState(
      initialExpense?.currency ??
        defaultCurrency ??
        'ILS',
    )

  const [expenseDate, setExpenseDate] =
    useState(
      initialExpense?.expenseDate ?? '',
    )

  const [referenceUrl, setReferenceUrl] =
    useState(
      initialExpense?.referenceUrl ?? '',
    )

  const [notes, setNotes] = useState(
    initialExpense?.notes ?? '',
  )

  const isCustomCategory =
    categoryOption === 'CUSTOM'

  const finalCategory = isCustomCategory
    ? customCategory
    : categoryOption

  const currentExpenseData =
    normalizeExpenseData({
      category: finalCategory,
      title,
      amount,
      currency,
      expenseDate,
      referenceUrl,
      notes,
    })

  const initialExpenseData = isEditing
    ? normalizeExpenseData({
        category:
          initialExpense.category ?? '',
        title:
          initialExpense.title ?? '',
        amount:
          initialExpense.amount ?? '',
        currency:
          initialExpense.currency ?? '',
        expenseDate:
          initialExpense.expenseDate ?? null,
        referenceUrl:
          initialExpense.referenceUrl ?? null,
        notes:
          initialExpense.notes ?? null,
      })
    : null

  const hasChanges =
    !isEditing ||
    JSON.stringify(currentExpenseData) !==
      JSON.stringify(initialExpenseData)

  const hasValidAmount =
    Number.isFinite(
      currentExpenseData.amount,
    ) &&
    currentExpenseData.amount > 0

  const hasValidCurrency =
    /^[A-Z]{3}$/.test(
      currentExpenseData.currency,
    )

  const hasValidCategory =
    currentExpenseData.category.length > 0 &&
    currentExpenseData.category.length <= 50

  const hasValidTitle =
    currentExpenseData.title.length > 0 &&
    currentExpenseData.title.length <= 100

  const hasValidReferenceUrl =
    isValidHttpUrl(referenceUrl)

  const isSubmitDisabled =
    !hasValidCategory ||
    !hasValidTitle ||
    !hasValidAmount ||
    !hasValidCurrency ||
    !hasValidReferenceUrl ||
    !hasChanges ||
    isSubmitting

  const handleCategoryChange = (
    event,
  ) => {
    const nextCategory =
      event.target.value

    setCategoryOption(nextCategory)

    if (nextCategory !== 'CUSTOM') {
      setCustomCategory('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitDisabled) {
      return
    }

    await onSubmit(currentExpenseData)
  }

  return (
    <form
      className="expense-form"
      onSubmit={handleSubmit}
    >
      <div className="expense-form__grid">
        <div className="expense-form__field">
          <label
            className="expense-form__label"
            htmlFor="expense-category"
          >
            Category
          </label>

          <select
            id="expense-category"
            className="expense-form__control"
            value={categoryOption}
            onChange={handleCategoryChange}
          >
            <option value="">
              Select category
            </option>

            {categoryOptions.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ),
            )}

            <option value="CUSTOM">
              Custom category
            </option>
          </select>
        </div>

        {isCustomCategory && (
          <div className="expense-form__field">
            <label
              className="expense-form__label"
              htmlFor="expense-custom-category"
            >
              Custom category
            </label>

            <input
              id="expense-custom-category"
              className="expense-form__control"
              type="text"
              maxLength={50}
              autoComplete="off"
              placeholder="eSIM Plan"
              value={customCategory}
              onChange={(event) =>
                setCustomCategory(
                  event.target.value,
                )
              }
            />
          </div>
        )}

        <div className="expense-form__field expense-form__field--wide">
          <label
            className="expense-form__label"
            htmlFor="expense-title"
          >
            Expense title
          </label>

          <input
            id="expense-title"
            className="expense-form__control"
            type="text"
            maxLength={100}
            autoComplete="off"
            placeholder="Hotel, museum tickets, dinner..."
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />
        </div>

        <div className="expense-form__field">
          <label
            className="expense-form__label"
            htmlFor="expense-amount"
          >
            Amount
          </label>

          <input
            id="expense-amount"
            className="expense-form__control"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="100"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
          />
        </div>

        <CurrencySelector
          id="expense-currency"
          label="Currency"
          value={currency}
          onChange={setCurrency}
        />

        <div className="expense-form__field">
          <label
            className="expense-form__label"
            htmlFor="expense-date"
          >
            Date
            <span className="expense-form__optional">
              Optional
            </span>
          </label>

          <input
            id="expense-date"
            className="expense-form__control"
            type="date"
            value={expenseDate}
            onChange={(event) =>
              setExpenseDate(
                event.target.value,
              )
            }
          />
        </div>

        <div className="expense-form__field">
          <label
            className="expense-form__label"
            htmlFor="expense-reference-url"
          >
            Reference link
            <span className="expense-form__optional">
              Optional
            </span>
          </label>

          <input
            id="expense-reference-url"
            className="expense-form__control"
            type="url"
            maxLength={2048}
            autoComplete="off"
            placeholder="https://..."
            value={referenceUrl}
            onChange={(event) =>
              setReferenceUrl(
                event.target.value,
              )
            }
          />

          {referenceUrl &&
            !hasValidReferenceUrl && (
              <p className="expense-form__validation">
                Enter a valid HTTP or HTTPS
                link.
              </p>
            )}
        </div>

        <div className="expense-form__field expense-form__field--full">
          <label
            className="expense-form__label"
            htmlFor="expense-notes"
          >
            Notes
            <span className="expense-form__optional">
              Optional
            </span>
          </label>

          <textarea
            id="expense-notes"
            className="expense-form__textarea"
            rows={4}
            maxLength={2000}
            placeholder="Add any useful details"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
          />
        </div>
      </div>

      {submitError && (
        <p
          className="expense-form__error"
          role="alert"
        >
          {submitError}
        </p>
      )}

      <div className="expense-form__actions">
        <button
          className="expense-form__cancel"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button
          className="expense-form__submit"
          type="submit"
          disabled={isSubmitDisabled}
        >
          {isSubmitting
            ? isEditing
              ? 'Saving changes...'
              : 'Adding expense...'
            : isEditing
              ? 'Save changes'
              : 'Add expense'}
        </button>
      </div>
    </form>
  )
}

export default ExpenseForm