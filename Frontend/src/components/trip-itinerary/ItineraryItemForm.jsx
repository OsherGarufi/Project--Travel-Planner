import {
  useState,
} from 'react'
import '../../css/components/itinerary-item-form.css'
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

const SCHEDULE_TYPES = {
  SCHEDULED: 'scheduled',
  PLAN_LATER: 'plan-later',
}

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

function toInputTimeValue(
  value,
) {
  if (!value) {
    return ''
  }

  return value.slice(
    0,
    5,
  )
}

function toApiTimeValue(
  timeValue,
) {
  if (!timeValue) {
    return null
  }

  return `${timeValue}:00`
}

function isBuiltInCategory(
  category,
) {
  return BUILT_IN_CATEGORIES.includes(
    category,
  )
}

function isValidHttpUrl(
  value,
) {
  if (!value.trim()) {
    return true
  }

  try {
    const url =
      new URL(
        value.trim(),
      )

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    )
  } catch {
    return false
  }
}

function ItineraryItemForm({
  initialDate,
  initialItem = null,
  minDate,
  maxDate,
  isSubmitting,
  externalError,
  onSubmit,
  onCancel,
}) {
  const isEditMode =
    Boolean(initialItem)

  const initialCategory =
    initialItem?.category ??
    ''

  const initialIsCustomCategory =
    Boolean(
      initialCategory &&
      !isBuiltInCategory(
        initialCategory,
      ),
    )

  const initialIsScheduled =
    Boolean(
      initialItem
        ? (
            initialItem.itineraryDate &&
            initialItem.startTime &&
            initialItem.endTime
          )
        : true,
    )

  const [
    title,
    setTitle,
  ] = useState(
    initialItem?.title ??
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
    scheduleType,
    setScheduleType,
  ] = useState(
    initialIsScheduled
      ? SCHEDULE_TYPES.SCHEDULED
      : SCHEDULE_TYPES.PLAN_LATER,
  )

  const [
    itineraryDate,
    setItineraryDate,
  ] = useState(
    initialItem
      ?.itineraryDate ||
      initialDate ||
      minDate ||
      '',
  )

  const [
    startTime,
    setStartTime,
  ] = useState(
    toInputTimeValue(
      initialItem?.startTime,
    ),
  )

  const [
    endTime,
    setEndTime,
  ] = useState(
    toInputTimeValue(
      initialItem?.endTime,
    ),
  )

  const [
    cost,
    setCost,
  ] = useState(
    initialItem?.cost != null &&
    Number(
      initialItem.cost,
    ) > 0
      ? String(
          initialItem.cost,
        )
      : '',
  )

  const [
    currency,
    setCurrency,
  ] = useState(
    initialItem?.currency ||
      'ILS',
  )

  const [
    description,
    setDescription,
  ] = useState(
    initialItem
      ?.description ??
      '',
  )

  const [
    referenceUrl,
    setReferenceUrl,
  ] = useState(
    initialItem
      ?.referenceUrl ??
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
    scheduleType ===
    SCHEDULE_TYPES.SCHEDULED

  const numericCost =
    cost === ''
      ? 0
      : Number(cost)

  const isPaidActivity =
    Number.isFinite(
      numericCost,
    ) &&
    numericCost > 0

  const handleCategoryChange =
    (event) => {
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

  const handleScheduleTypeChange =
    (
      nextScheduleType,
    ) => {
      setScheduleType(
        nextScheduleType,
      )

      setValidationError('')

      if (
        nextScheduleType ===
        SCHEDULE_TYPES.PLAN_LATER
      ) {
        setStartTime('')
        setEndTime('')
      }
    }

  const handleCostChange =
    (event) => {
      const nextValue =
        event.target.value

      if (
        nextValue === '' ||
        /^\d*\.?\d{0,2}$/.test(
          nextValue,
        )
      ) {
        setCost(
          nextValue,
        )
      }
    }

  const handleSubmit =
    async (event) => {
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
          numericCost,
        ) ||
        numericCost < 0
      ) {
        setValidationError(
          'Please enter a valid cost.',
        )

        return
      }

      if (
        isPaidActivity &&
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

        description:
          normalizedDescription ||
          null,

        referenceUrl:
          normalizedReferenceUrl ||
          null,

        cost:
          numericCost,

        currency:
          isPaidActivity
            ? normalizedCurrency
            : null,
      })
    }

  const displayedError =
    validationError ||
    externalError

  return (
    <section className="itinerary-item-form">
      <header className="itinerary-item-form__header">
        <div className="itinerary-item-form__header-icon">
          <ActivityIcon />
        </div>

        <div className="itinerary-item-form__header-copy">
          <p className="itinerary-item-form__eyebrow">
            TRIP ITINERARY
          </p>

          <h1 className="itinerary-item-form__title">
            {isEditMode
              ? 'Edit activity'
              : 'Add activity'}
          </h1>

          <p className="itinerary-item-form__description">
            {isEditMode
              ? 'Update the activity details, schedule or cost.'
              : 'Add something to your itinerary and choose whether to schedule it now or plan it later.'}
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
                  Activity details
                </h2>

                <p className="itinerary-item-form__section-description">
                  Basic information
                  about this activity.
                </p>
              </div>
            </div>

            <div className="itinerary-item-form__details-grid">
              <div className="itinerary-item-form__field">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="itinerary-title"
                >
                  Title
                </label>

                <input
                  className="itinerary-item-form__control"
                  id="itinerary-title"
                  type="text"
                  value={title}
                  maxLength={100}
                  placeholder="e.g. Visit the museum"
                  autoFocus
                  disabled={
                    isSubmitting
                  }
                  onChange={(
                    event,
                  ) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="itinerary-item-form__field">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="itinerary-category"
                >
                  Category
                </label>

                <select
                  className="itinerary-item-form__control"
                  id="itinerary-category"
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

                  {BUILT_IN_CATEGORIES.map(
                    (
                      category,
                    ) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
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
                    htmlFor="itinerary-custom-category"
                  >
                    Custom category
                  </label>

                  <input
                    className="itinerary-item-form__control"
                    id="itinerary-custom-category"
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
                    onChange={(
                      event,
                    ) =>
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
                  Schedule
                </h2>

                <p className="itinerary-item-form__section-description">
                  Schedule the activity
                  now or leave it ready
                  for later.
                </p>
              </div>
            </div>

            <fieldset className="itinerary-item-form__schedule">
              <legend className="sr-only">
                Activity schedule
              </legend>

              <label
                className={
                  scheduleType ===
                  SCHEDULE_TYPES.SCHEDULED
                    ? 'itinerary-item-form__schedule-option itinerary-item-form__schedule-option--active'
                    : 'itinerary-item-form__schedule-option'
                }
              >
                <input
                  type="radio"
                  name="schedule-type"
                  checked={
                    scheduleType ===
                    SCHEDULE_TYPES.SCHEDULED
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={() =>
                    handleScheduleTypeChange(
                      SCHEDULE_TYPES.SCHEDULED,
                    )
                  }
                />

                <span>
                  Scheduled
                </span>
              </label>

              <label
                className={
                  scheduleType ===
                  SCHEDULE_TYPES.PLAN_LATER
                    ? 'itinerary-item-form__schedule-option itinerary-item-form__schedule-option--active'
                    : 'itinerary-item-form__schedule-option'
                }
              >
                <input
                  type="radio"
                  name="schedule-type"
                  checked={
                    scheduleType ===
                    SCHEDULE_TYPES.PLAN_LATER
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={() =>
                    handleScheduleTypeChange(
                      SCHEDULE_TYPES.PLAN_LATER,
                    )
                  }
                />

                <span>
                  Plan later
                </span>
              </label>
            </fieldset>

            {isScheduled ? (
              <div className="itinerary-item-form__schedule-grid">
                <div className="itinerary-item-form__field">
                  <label
                    className="itinerary-item-form__label"
                    htmlFor="itinerary-date"
                  >
                    Date
                  </label>

                  <input
                    className="itinerary-item-form__control"
                    id="itinerary-date"
                    type="date"
                    value={
                      itineraryDate
                    }
                    min={minDate}
                    max={maxDate}
                    disabled={
                      isSubmitting
                    }
                    onChange={(
                      event,
                    ) =>
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
                      htmlFor="itinerary-start-time"
                    >
                      Start time
                    </label>

                    <input
                      className="itinerary-item-form__control"
                      id="itinerary-start-time"
                      type="time"
                      value={
                        startTime
                      }
                      step={900}
                      disabled={
                        isSubmitting
                      }
                      onChange={(
                        event,
                      ) =>
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
                      htmlFor="itinerary-end-time"
                    >
                      End time
                    </label>

                    <input
                      className="itinerary-item-form__control"
                      id="itinerary-end-time"
                      type="time"
                      value={
                        endTime
                      }
                      step={900}
                      disabled={
                        isSubmitting
                      }
                      onChange={(
                        event,
                      ) =>
                        setEndTime(
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
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
          </section>

          <section className="itinerary-item-form__section">
            <div className="itinerary-item-form__section-header">
              <div>
                <h2 className="itinerary-item-form__section-title">
                  Cost
                </h2>

                <p className="itinerary-item-form__section-description">
                  Leave the amount empty
                  for a free activity.
                </p>
              </div>
            </div>

            <div className="itinerary-item-form__cost-grid">
              <div className="itinerary-item-form__field">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="itinerary-cost"
                >
                  Amount
                  <span className="itinerary-item-form__optional">
                    Optional
                  </span>
                </label>

                <input
                  className="itinerary-item-form__control"
                  id="itinerary-cost"
                  type="text"
                  inputMode="decimal"
                  value={cost}
                  placeholder="0"
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    handleCostChange
                  }
                />
              </div>

              <div className="itinerary-item-form__currency">
                <CurrencySelector
                  id="itinerary-currency"
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
                  htmlFor="itinerary-description"
                >
                  Description
                  <span className="itinerary-item-form__optional">
                    Optional
                  </span>
                </label>

                <textarea
                  className="itinerary-item-form__textarea"
                  id="itinerary-description"
                  value={
                    description
                  }
                  maxLength={2000}
                  rows={3}
                  placeholder="Reservation details, notes or anything useful..."
                  disabled={
                    isSubmitting
                  }
                  onChange={(
                    event,
                  ) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="itinerary-item-form__field itinerary-item-form__field--full">
                <label
                  className="itinerary-item-form__label"
                  htmlFor="itinerary-reference-url"
                >
                  Reference URL
                  <span className="itinerary-item-form__optional">
                    Optional
                  </span>
                </label>

                <input
                  className="itinerary-item-form__control"
                  id="itinerary-reference-url"
                  type="url"
                  value={
                    referenceUrl
                  }
                  maxLength={2048}
                  placeholder="https://..."
                  disabled={
                    isSubmitting
                  }
                  onChange={(
                    event,
                  ) =>
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
                    isEditMode
                      ? 'Saving changes...'
                      : 'Adding activity...'
                  )
                : (
                    isEditMode
                      ? 'Save changes'
                      : 'Add activity'
                  )}
            </button>
          </div>
        </footer>
      </form>
    </section>
  )
}

export default ItineraryItemForm