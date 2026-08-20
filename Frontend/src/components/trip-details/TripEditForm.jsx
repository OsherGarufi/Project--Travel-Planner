import BudgetSection from '../plan-trip/BudgetSection'
import '../../css/components/trip-edit-form.css'

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

function TripEditForm({
  title,
  budgetAmount,
  budgetCurrency,
  localCurrency,
  notes,
  isSaving,
  saveError,
  onTitleChange,
  onBudgetAmountChange,
  onBudgetCurrencyChange,
  onNotesChange,
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

  const isSaveDisabled =
    !title.trim() ||
    !hasValidBudget ||
    !hasValidCurrency ||
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
            Change the trip name, planned budget or
            personal notes.
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