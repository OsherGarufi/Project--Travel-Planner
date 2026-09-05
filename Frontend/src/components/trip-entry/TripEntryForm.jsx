import {
  useMemo,
  useState,
} from 'react'
import '../../css/components/itinerary-item-form.css'
import '../../css/components/trip-entry-form.css'
import CurrencySelector from '../currency/CurrencySelector'

export const TRIP_ENTRY_TYPES = {
  SCHEDULED: 'scheduled',
  PLAN_LATER: 'plan-later',
  ONLY_EXPENSE: 'only-expense',
}

export const TRIP_ENTRY_FORM_MODES = {
  CREATE_ACTIVITY: 'create-activity',
  CREATE_EXPENSE: 'create-expense',
  EDIT_EXPENSE: 'edit-expense',
}

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

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 3v3M16 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 12v5M9.5 14.5h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ExpenseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M14.75 8.75c-.55-.55-1.45-.9-2.55-.9-1.55 0-2.7.75-2.7 1.85 0 1.2 1.05 1.65 2.7 2 1.65.35 2.65.8 2.65 2 0 1.2-1.15 2-2.75 2-1.15 0-2.15-.35-2.85-1.05M12 6.5v11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function toInputTimeValue(value) {
  if (!value) {
    return ''
  }

  return value.slice(0, 5)
}

function toApiTimeValue(value) {
  if (!value) {
    return null
  }

  return `${value}:00`
}

function isValidHttpUrl(value) {
  if (!value.trim()) {
    return true
  }

  try {
    const url =
      new URL(value.trim())

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    )
  } catch {
    return false
  }
}

function TripEntryForm({
  formMode =
    TRIP_ENTRY_FORM_MODES.CREATE_ACTIVITY,

  initialEntry = null,

  initialDate = '',
  minDate = '',
  maxDate = '',

  defaultCurrency = 'ILS',
  existingCategories = [],

  initialEntryType =
    TRIP_ENTRY_TYPES.SCHEDULED,

  allowOnlyExpense = false,
  requireAmount = false,

  lockEntryType = false,
  lockSchedule = false,

  isSubmitting = false,
  externalError = '',

  onSubmit,
  onCancel,
}) {
  const isExpenseEdit =
    formMode ===
    TRIP_ENTRY_FORM_MODES.EDIT_EXPENSE

  const initialCategory =
    initialEntry?.category ??
    ''

  const categoryOptions =
    useMemo(() => {
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

  const initialIsCustomCategory =
    Boolean(
      initialCategory &&
        !BUILT_IN_CATEGORIES.some(
          (category) =>
            category.toLowerCase() ===
            initialCategory.toLowerCase(),
        ),
    )

  const resolvedInitialEntryType =
    !allowOnlyExpense &&
    initialEntryType ===
      TRIP_ENTRY_TYPES.ONLY_EXPENSE
      ? TRIP_ENTRY_TYPES.SCHEDULED
      : initialEntryType

  const [
    title,
    setTitle,
  ] = useState(
    initialEntry?.title ??
      '',
  )

  const [
    categoryOption,
    setCategoryOption,
  ] = useState(
    initialIsCustomCategory
      ? 'CUSTOM'
      : initialCategory,
  )

  const [
    customCategory,
    setCustomCategory,
  ] = useState(
    initialIsCustomCategory
      ? initialCategory
      : '',
  )

  const [
    entryType,
    setEntryType,
  ] = useState(
    initialEntry?.entryType ??
      resolvedInitialEntryType,
  )

  const [
    itineraryDate,
    setItineraryDate,
  ] = useState(
    initialEntry?.itineraryDate ||
      initialDate ||
      minDate ||
      '',
  )

  const [
    startTime,
    setStartTime,
  ] = useState(
    toInputTimeValue(
      initialEntry?.startTime,
    ),
  )

  const [
    endTime,
    setEndTime,
  ] = useState(
    toInputTimeValue(
      initialEntry?.endTime,
    ),
  )

  const [
    amount,
    setAmount,
  ] = useState(
    initialEntry?.amount != null
      ? String(
          initialEntry.amount,
        )
      : '',
  )

  const [
    currency,
    setCurrency,
  ] = useState(
    initialEntry?.currency ??
      defaultCurrency ??
      'ILS',
  )

  const [
    description,
    setDescription,
  ] = useState(
    initialEntry?.description ??
      '',
  )

  const [
    referenceUrl,
    setReferenceUrl,
  ] = useState(
    initialEntry?.referenceUrl ??
      '',
  )

  const [
    validationError,
    setValidationError,
  ] = useState('')

  const isCustomCategory =
    categoryOption ===
    'CUSTOM'

  const finalCategory =
    isCustomCategory
      ? customCategory.trim()
      : categoryOption.trim()

  const isScheduled =
    entryType ===
    TRIP_ENTRY_TYPES.SCHEDULED

  const isPlanLater =
    entryType ===
    TRIP_ENTRY_TYPES.PLAN_LATER

  const isOnlyExpense =
    entryType ===
    TRIP_ENTRY_TYPES.ONLY_EXPENSE

  const numericAmount =
    amount === ''
      ? 0
      : Number(amount)

  const hasAmount =
    Number.isFinite(
      numericAmount,
    ) &&
    numericAmount > 0

  const isAmountRequired =
    requireAmount ||
    isOnlyExpense

  const handleCategoryChange = (
    event,
  ) => {
    const nextCategory =
      event.target.value

    setCategoryOption(
      nextCategory,
    )

    if (
      nextCategory !==
      'CUSTOM'
    ) {
      setCustomCategory('')
    }

    setValidationError('')
  }

  const handleEntryTypeChange = (
    nextEntryType,
  ) => {
    if (lockEntryType) {
      return
    }

    if (
      nextEntryType ===
        TRIP_ENTRY_TYPES.ONLY_EXPENSE &&
      !allowOnlyExpense
    ) {
      return
    }

    setEntryType(
      nextEntryType,
    )

    setValidationError('')

    if (
      nextEntryType !==
      TRIP_ENTRY_TYPES.SCHEDULED
    ) {
      setStartTime('')
      setEndTime('')
    }
  }

  const handleAmountChange = (
    event,
  ) => {
    const nextValue =
      event.target.value

    if (
      nextValue === '' ||
      /^\d*\.?\d{0,2}$/.test(
        nextValue,
      )
    ) {
      setAmount(
        nextValue,
      )
    }
  }

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault()

    const normalizedTitle =
      title.trim()

    const normalizedDescription =
      description.trim()

    const normalizedReferenceUrl =
      referenceUrl.trim()

    const normalizedCurrency =
      currency
        .trim()
        .toUpperCase()

    if (!normalizedTitle) {
      setValidationError(
        'Please enter a title.',
      )

      return
    }

    if (!finalCategory) {
      setValidationError(
        'Please choose or enter a category.',
      )

      return
    }

    if (
      finalCategory.length >
      50
    ) {
      setValidationError(
        'Category cannot exceed 50 characters.',
      )

      return
    }

    if (
      isScheduled &&
      !itineraryDate
    ) {
      setValidationError(
        'Please choose a date.',
      )

      return
    }

    if (isScheduled) {
      if (
        !startTime ||
        !endTime
      ) {
        setValidationError(
          'Please choose both a start time and an end time.',
        )

        return
      }

      if (
        endTime <= startTime
      ) {
        setValidationError(
          'End time must be later than start time.',
        )

        return
      }
    }

    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount < 0
    ) {
      setValidationError(
        'Please enter a valid amount.',
      )

      return
    }

    if (
      isAmountRequired &&
      !hasAmount
    ) {
      setValidationError(
        'An expense must have an amount greater than zero.',
      )

      return
    }

    if (
      hasAmount &&
      !/^[A-Z]{3}$/.test(
        normalizedCurrency,
      )
    ) {
      setValidationError(
        'Please enter a valid 3-letter currency code.',
      )

      return
    }

    if (
      !isValidHttpUrl(
        referenceUrl,
      )
    ) {
      setValidationError(
        'Reference URL must use HTTP or HTTPS.',
      )

      return
    }

    setValidationError('')

    return onSubmit({
      entryType,

      title:
        normalizedTitle,

      category:
        finalCategory,

      itineraryDate:
        isScheduled
          ? itineraryDate
          : null,

      startTime:
        isScheduled
          ? toApiTimeValue(
              startTime,
            )
          : null,

      endTime:
        isScheduled
          ? toApiTimeValue(
              endTime,
            )
          : null,

      amount:
        numericAmount,

      currency:
        hasAmount
          ? normalizedCurrency
          : null,

      description:
        normalizedDescription ||
        null,

      referenceUrl:
        normalizedReferenceUrl ||
        null,
    })
  }

  const displayedError =
    validationError ||
    externalError

  const selectorClassName =
    allowOnlyExpense
      ? 'itinerary-item-form__schedule trip-entry-form__type-selector'
      : 'itinerary-item-form__schedule'

  const pageTitle =
    isExpenseEdit
      ? 'Edit expense'
      : allowOnlyExpense
        ? 'Add trip item'
        : 'Add activity'

  const pageDescription =
    isExpenseEdit
      ? 'Update the expense details while keeping its itinerary connection consistent.'
      : allowOnlyExpense
        ? 'Schedule an activity, save it for later or track an expense without adding it to the itinerary.'
        : 'Add something to your itinerary and choose whether to schedule it now or plan it later.'

  const eyebrow =
    isExpenseEdit
      ? 'TRIP EXPENSES'
      : 'TRIP PLANNER'

  return (
    <section className="itinerary-item-form">
      <header className="itinerary-item-form__header">
        <div className="itinerary-item-form__header-icon">
          {isExpenseEdit ||
          isOnlyExpense
            ? (
                <ExpenseIcon />
              )
            : (
                <ActivityIcon />
              )}
        </div>

        <div className="itinerary-item-form__header-copy">
          <p className="itinerary-item-form__eyebrow">
            {eyebrow}
          </p>

          <h1 className="itinerary-item-form__title">
            {pageTitle}
          </h1>

          <p className="itinerary-item-form__description">
            {pageDescription}
          </p>
        </div>
      </header>

      <form
        className="itinerary-item-form__form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="itinerary-item-form__body">
          <section className="itinerary-item-form__section">
            <div className="itinerary-item-form__section-header">
              <div>
                <h2 className="itinerary-item-form__section-title">
                  {isExpenseEdit
                    ? 'Expense details'
                    : 'Details'}
                </h2>

                <p className="itinerary-item-form__section-description">
                  Basic information
                  about this trip item.
                </p>
              </div>
            </div>

            <div className="itinerary-item-form__details-grid">
              <div className="itinerary-item-form__field">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="trip-entry-title"
                >
                  Title
                </label>

                <input
                  className="itinerary-item-form__control"
                  id="trip-entry-title"
                  type="text"
                  value={title}
                  maxLength={100}
                  placeholder="e.g. Visit the museum"
                  autoFocus
                  disabled={
                    isSubmitting
                  }
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="itinerary-item-form__field">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="trip-entry-category"
                >
                  Category
                </label>

                <select
                  className="itinerary-item-form__control"
                  id="trip-entry-category"
                  value={
                    categoryOption
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    handleCategoryChange
                  }
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
                <div className="itinerary-item-form__field itinerary-item-form__field--full">
                  <label
                    className="itinerary-item-form__label"
                    htmlFor="trip-entry-custom-category"
                  >
                    Custom category
                  </label>

                  <input
                    className="itinerary-item-form__control"
                    id="trip-entry-custom-category"
                    type="text"
                    value={
                      customCategory
                    }
                    maxLength={50}
                    autoComplete="off"
                    placeholder="e.g. Nightlife"
                    disabled={
                      isSubmitting
                    }
                    onChange={(event) =>
                      setCustomCategory(
                        event.target.value,
                      )
                    }
                  />
                </div>
              )}
            </div>
          </section>

          <section className="itinerary-item-form__section">
            <div className="itinerary-item-form__section-header">
              <div>
                <h2 className="itinerary-item-form__section-title">
                  Trip placement
                </h2>

                <p className="itinerary-item-form__section-description">
                  {isExpenseEdit
                    ? 'The current itinerary relationship is shown below.'
                    : 'Choose where this item should live in your trip.'}
                </p>
              </div>
            </div>

            <fieldset
              className={
                selectorClassName
              }
            >
              <legend className="sr-only">
                Trip item type
              </legend>

              <label
                className={
                  isScheduled
                    ? 'itinerary-item-form__schedule-option itinerary-item-form__schedule-option--active'
                    : 'itinerary-item-form__schedule-option'
                }
              >
                <input
                  type="radio"
                  name="trip-entry-type"
                  checked={
                    isScheduled
                  }
                  disabled={
                    isSubmitting ||
                    lockEntryType
                  }
                  onChange={() =>
                    handleEntryTypeChange(
                      TRIP_ENTRY_TYPES.SCHEDULED,
                    )
                  }
                />

                <span>
                  Scheduled
                </span>
              </label>

              <label
                className={
                  isPlanLater
                    ? 'itinerary-item-form__schedule-option itinerary-item-form__schedule-option--active'
                    : 'itinerary-item-form__schedule-option'
                }
              >
                <input
                  type="radio"
                  name="trip-entry-type"
                  checked={
                    isPlanLater
                  }
                  disabled={
                    isSubmitting ||
                    lockEntryType
                  }
                  onChange={() =>
                    handleEntryTypeChange(
                      TRIP_ENTRY_TYPES.PLAN_LATER,
                    )
                  }
                />

                <span>
                  Plan later
                </span>
              </label>

              {allowOnlyExpense && (
                <label
                  className={
                    isOnlyExpense
                      ? 'itinerary-item-form__schedule-option itinerary-item-form__schedule-option--active'
                      : 'itinerary-item-form__schedule-option'
                  }
                >
                  <input
                    type="radio"
                    name="trip-entry-type"
                    checked={
                      isOnlyExpense
                    }
                    disabled={
                      isSubmitting ||
                      lockEntryType
                    }
                    onChange={() =>
                      handleEntryTypeChange(
                        TRIP_ENTRY_TYPES.ONLY_EXPENSE,
                      )
                    }
                  />

                  <span>
                    Only expense
                  </span>
                </label>
              )}
            </fieldset>

            {isExpenseEdit &&
              lockEntryType && (
                <div className="itinerary-item-form__plan-later">
                  <div className="itinerary-item-form__plan-later-icon">
                    {isOnlyExpense
                      ? (
                          <ExpenseIcon />
                        )
                      : (
                          <ActivityIcon />
                        )}
                  </div>

                  <div>
                    <p className="itinerary-item-form__plan-later-title">
                      {isOnlyExpense
                        ? 'Expense only'
                        : 'Linked to itinerary'}
                    </p>

                    <p className="itinerary-item-form__plan-later-description">
                      {isOnlyExpense
                        ? 'This expense is not linked to an itinerary activity.'
                        : 'Shared expense details can be edited here. Schedule changes are managed from the itinerary.'}
                    </p>
                  </div>
                </div>
              )}

            {isScheduled && (
              <div className="itinerary-item-form__schedule-grid">
                <div className="itinerary-item-form__field">
                  <label
                    className="itinerary-item-form__label"
                    htmlFor="trip-entry-date"
                  >
                    Date
                  </label>

                  <input
                    className="itinerary-item-form__control"
                    id="trip-entry-date"
                    type="date"
                    value={
                      itineraryDate
                    }
                    min={minDate}
                    max={maxDate}
                    disabled={
                      isSubmitting ||
                      lockSchedule
                    }
                    onChange={(event) =>
                      setItineraryDate(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="itinerary-item-form__time-group">
                  <div className="itinerary-item-form__field">
                    <label
                      className="itinerary-item-form__label"
                      htmlFor="trip-entry-start-time"
                    >
                      Start time
                    </label>

                    <input
                      className="itinerary-item-form__control"
                      id="trip-entry-start-time"
                      type="time"
                      value={
                        startTime
                      }
                      step={900}
                      disabled={
                        isSubmitting ||
                        lockSchedule
                      }
                      onChange={(event) =>
                        setStartTime(
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div
                    className="itinerary-item-form__time-divider"
                    aria-hidden="true"
                  >
                    →
                  </div>

                  <div className="itinerary-item-form__field">
                    <label
                      className="itinerary-item-form__label"
                      htmlFor="trip-entry-end-time"
                    >
                      End time
                    </label>

                    <input
                      className="itinerary-item-form__control"
                      id="trip-entry-end-time"
                      type="time"
                      value={
                        endTime
                      }
                      step={900}
                      disabled={
                        isSubmitting ||
                        lockSchedule
                      }
                      onChange={(event) =>
                        setEndTime(
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {!isExpenseEdit &&
              isPlanLater && (
                <div className="itinerary-item-form__plan-later">
                  <div className="itinerary-item-form__plan-later-icon">
                    <ActivityIcon />
                  </div>

                  <div>
                    <p className="itinerary-item-form__plan-later-title">
                      Keep it unscheduled
                    </p>

                    <p className="itinerary-item-form__plan-later-description">
                      The activity will wait
                      in your itinerary until
                      you assign a day and
                      time.
                    </p>
                  </div>
                </div>
              )}

            {!isExpenseEdit &&
              isOnlyExpense && (
                <div className="itinerary-item-form__plan-later">
                  <div className="itinerary-item-form__plan-later-icon">
                    <ExpenseIcon />
                  </div>

                  <div>
                    <p className="itinerary-item-form__plan-later-title">
                      Track only the expense
                    </p>

                    <p className="itinerary-item-form__plan-later-description">
                      This item will be saved
                      in Expenses only and
                      will not be added to
                      your itinerary.
                    </p>
                  </div>
                </div>
              )}
          </section>

          <section className="itinerary-item-form__section">
            <div className="itinerary-item-form__section-header">
              <div>
                <h2 className="itinerary-item-form__section-title">
                  Cost
                </h2>

                <p className="itinerary-item-form__section-description">
                  {isAmountRequired
                    ? 'Enter the amount you want to track for this expense.'
                    : 'Leave the amount empty for a free activity.'}
                </p>
              </div>
            </div>

            <div className="itinerary-item-form__cost-grid">
              <div className="itinerary-item-form__field">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="trip-entry-amount"
                >
                  Amount

                  {!isAmountRequired && (
                    <span className="itinerary-item-form__optional">
                      Optional
                    </span>
                  )}
                </label>

                <input
                  className="itinerary-item-form__control"
                  id="trip-entry-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  placeholder={
                    isAmountRequired
                      ? '100'
                      : '0'
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    handleAmountChange
                  }
                />
              </div>

              <div className="itinerary-item-form__currency">
                <CurrencySelector
                  id="trip-entry-currency"
                  label="Currency"
                  value={currency}
                  onChange={
                    setCurrency
                  }
                />
              </div>
            </div>
          </section>

          <section className="itinerary-item-form__section">
            <div className="itinerary-item-form__section-header">
              <div>
                <h2 className="itinerary-item-form__section-title">
                  Extra details
                </h2>

                <p className="itinerary-item-form__section-description">
                  Optional notes,
                  booking details or
                  useful links.
                </p>
              </div>
            </div>

            <div className="itinerary-item-form__extra-grid">
              <div className="itinerary-item-form__field itinerary-item-form__field--full">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="trip-entry-description"
                >
                  {isExpenseEdit ||
                  isOnlyExpense
                    ? 'Notes'
                    : 'Description'}

                  <span className="itinerary-item-form__optional">
                    Optional
                  </span>
                </label>

                <textarea
                  className="itinerary-item-form__textarea"
                  id="trip-entry-description"
                  value={
                    description
                  }
                  maxLength={2000}
                  rows={3}
                  placeholder={
                    isExpenseEdit ||
                    isOnlyExpense
                      ? 'Receipt details, payment notes or anything useful...'
                      : 'Reservation details, notes or anything useful...'
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="itinerary-item-form__field itinerary-item-form__field--full">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="trip-entry-reference-url"
                >
                  Reference URL

                  <span className="itinerary-item-form__optional">
                    Optional
                  </span>
                </label>

                <input
                  className="itinerary-item-form__control"
                  id="trip-entry-reference-url"
                  type="url"
                  value={
                    referenceUrl
                  }
                  maxLength={2048}
                  placeholder="https://..."
                  disabled={
                    isSubmitting
                  }
                  onChange={(event) =>
                    setReferenceUrl(
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </section>
        </div>

        <footer className="itinerary-item-form__footer">
          <div className="itinerary-item-form__footer-message">
            {displayedError && (
              <div
                className="itinerary-item-form__error"
                role="alert"
              >
                {displayedError}
              </div>
            )}
          </div>

          <div className="itinerary-item-form__actions">
            <button
              className="itinerary-item-form__cancel"
              type="button"
              disabled={
                isSubmitting
              }
              onClick={
                onCancel
              }
            >
              Cancel
            </button>

            <button
              className="itinerary-item-form__submit"
              type="submit"
              disabled={
                isSubmitting
              }
            >
              {isSubmitting
                ? (
                    isExpenseEdit
                      ? 'Saving changes...'
                      : 'Adding...'
                  )
                : (
                    isExpenseEdit
                      ? 'Save changes'
                      : isOnlyExpense
                        ? 'Add expense'
                        : 'Add activity'
                  )}
            </button>
          </div>
        </footer>
      </form>
    </section>
  )
}

export default TripEntryForm