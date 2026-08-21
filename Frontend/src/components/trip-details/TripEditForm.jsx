import '../../css/components/trip-edit-form.css'
import BudgetSection from '../plan-trip/BudgetSection'

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m14.5 5.5 4 4M5 19l3.2-.7L18.5 8a2.1 2.1 0 0 0-3-3L5.2 15.3 5 19Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WeatherIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7.5 17.5h9a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.4 1.7A3.2 3.2 0 0 0 7.5 17.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TripEditForm({
  title,
  startDate,
  endDate,
  startDateMinimum,
  endDateMinimum,
  budgetAmount,
  budgetCurrency,
  localCurrency,
  notes,

  hasChanges,
  hasDateChanges,

  isSaving,
  saveError,

  isCheckingWeather,
  weatherLookupError,
  isWeatherOpen,
  weatherContent,

  onTitleChange,
  onStartDateChange,
  onEndDateChange,
  onBudgetAmountChange,
  onBudgetCurrencyChange,
  onNotesChange,

  onCheckWeather,
  onCloseWeather,
  onSave,
  onCancel,
}) {
  const numericBudgetAmount =
    Number(budgetAmount)

  const hasValidBudget =
    Number.isFinite(numericBudgetAmount) &&
    numericBudgetAmount > 0

  const hasValidCurrency =
    /^[A-Z]{3}$/.test(budgetCurrency)

  const hasValidDates =
    Boolean(startDate) &&
    Boolean(endDate) &&
    endDate >= startDate

  const isSaveDisabled =
    !title.trim() ||
    !hasValidDates ||
    !hasValidBudget ||
    !hasValidCurrency ||
    !hasChanges ||
    isSaving

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!isSaveDisabled) {
      onSave()
    }
  }

  return (
    <section
      className="trip-edit-form"
      aria-labelledby="trip-edit-title"
    >
      <div className="trip-edit-form__header">
        <span
          className="trip-edit-form__header-icon"
          aria-hidden="true"
        >
          <EditIcon />
        </span>

        <div>
          <p className="trip-edit-form__eyebrow">
            EDIT TRIP
          </p>

          <h2
            id="trip-edit-title"
            className="trip-edit-form__title"
          >
            Update trip details
          </h2>

          <p className="trip-edit-form__description">
            Change the trip name, travel dates,
            planned budget or personal notes.
          </p>
        </div>
      </div>

      <form
        className="trip-edit-form__form"
        onSubmit={handleSubmit}
      >
        <div className="trip-edit-form__field trip-edit-form__field--full">
          <label
            className="trip-edit-form__label"
            htmlFor="editTripTitle"
          >
            Trip title
          </label>

          <input
            id="editTripTitle"
            className="trip-edit-form__input"
            type="text"
            value={title}
            onChange={onTitleChange}
            maxLength={100}
            autoComplete="off"
          />
        </div>

        <div className="trip-edit-form__field">
          <label
            className="trip-edit-form__label"
            htmlFor="editTripStartDate"
          >
            Start date
          </label>

          <input
            id="editTripStartDate"
            className="trip-edit-form__input"
            type="date"
            value={startDate}
            min={startDateMinimum}
            onChange={onStartDateChange}
          />
        </div>

        <div className="trip-edit-form__field">
          <label
            className="trip-edit-form__label"
            htmlFor="editTripEndDate"
          >
            End date
          </label>

          <input
            id="editTripEndDate"
            className="trip-edit-form__input"
            type="date"
            value={endDate}
            min={endDateMinimum}
            onChange={onEndDateChange}
          />
        </div>

        {hasDateChanges &&
          hasValidDates &&
          !isWeatherOpen && (
            <div className="trip-edit-form__weather trip-edit-form__field--full">
              <div className="trip-edit-form__weather-copy">
                <span
                  className="trip-edit-form__weather-icon"
                  aria-hidden="true"
                >
                  <WeatherIcon />
                </span>

                <div>
                  <p className="trip-edit-form__weather-title">
                    Travel dates changed
                  </p>

                  <p className="trip-edit-form__weather-description">
                    Check the weather forecast for your
                    updated travel dates before saving.
                  </p>
                </div>
              </div>

              <button
                className="trip-edit-form__weather-button"
                type="button"
                onClick={onCheckWeather}
                disabled={isCheckingWeather}
              >
                {isCheckingWeather
                  ? 'Checking weather...'
                  : 'View weather forecast'}
              </button>

              {weatherLookupError && (
                <p
                  className="trip-edit-form__weather-error"
                  role="alert"
                >
                  {weatherLookupError}
                </p>
              )}
            </div>
          )}

        {hasDateChanges &&
          hasValidDates &&
          isWeatherOpen && (
            <div className="trip-edit-form__weather-expanded trip-edit-form__field--full">
              <div className="trip-edit-form__weather-expanded-actions">
                <button
                  className="trip-edit-form__weather-close"
                  type="button"
                  onClick={onCloseWeather}
                >
                  <CloseIcon />

                  <span>
                    Close forecast
                  </span>
                </button>
              </div>

              <div className="trip-edit-form__weather-content">
                {weatherContent}
              </div>
            </div>
          )}

        <div className="trip-edit-form__budget">
          <BudgetSection
            budgetAmount={budgetAmount}
            budgetCurrency={budgetCurrency}
            localCurrency={localCurrency}
            onBudgetAmountChange={
              onBudgetAmountChange
            }
            onBudgetCurrencyChange={
              onBudgetCurrencyChange
            }
          />
        </div>

        <div className="trip-edit-form__field trip-edit-form__field--full">
          <label
            className="trip-edit-form__label"
            htmlFor="editTripNotes"
          >
            Notes
          </label>

          <textarea
            id="editTripNotes"
            className="trip-edit-form__textarea"
            value={notes}
            onChange={onNotesChange}
            rows={6}
            placeholder="Add notes about your trip"
          />
        </div>

        {saveError && (
          <p
            className="trip-edit-form__error"
            role="alert"
          >
            {saveError}
          </p>
        )}

        <div className="trip-edit-form__actions">
          <button
            className="trip-edit-form__cancel"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            className="trip-edit-form__save"
            type="submit"
            disabled={isSaveDisabled}
          >
            {isSaving
              ? 'Saving changes...'
              : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default TripEditForm