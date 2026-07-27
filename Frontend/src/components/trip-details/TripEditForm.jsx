function TripEditForm({
  title,
  budgetAmount,
  budgetCurrency,
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
  const isSaveDisabled =
    !title.trim() ||
    budgetCurrency.trim().length !== 3 ||
    isSaving

  return (
    <section className="trip-edit-form">
      <h2>Edit Trip Details</h2>

      <div className="trip-edit-form__field">
        <label htmlFor="editTripTitle">
          Trip title
        </label>

        <input
          id="editTripTitle"
          type="text"
          value={title}
          onChange={onTitleChange}
          maxLength={100}
          autoComplete="off"
        />
      </div>

      <div className="trip-edit-form__field">
        <label htmlFor="editTripBudget">
          Planned budget
        </label>

        <input
          id="editTripBudget"
          type="number"
          value={budgetAmount}
          onChange={onBudgetAmountChange}
          min="0"
          step="0.01"
          placeholder="Optional"
        />
      </div>

      <div className="trip-edit-form__field">
        <label htmlFor="editTripCurrency">
          Currency
        </label>

        <input
          id="editTripCurrency"
          type="text"
          value={budgetCurrency}
          onChange={onBudgetCurrencyChange}
          minLength={3}
          maxLength={3}
          placeholder="ILS"
          autoComplete="off"
        />
      </div>

      <div className="trip-edit-form__field">
        <label htmlFor="editTripNotes">
          Notes
        </label>

        <textarea
          id="editTripNotes"
          value={notes}
          onChange={onNotesChange}
          rows={5}
          placeholder="Add notes about your trip"
        />
      </div>

      <div className="trip-edit-form__actions">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaveDisabled}
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>

      {saveError && (
        <p className="trip-edit-form__error">
          {saveError}
        </p>
      )}
    </section>
  )
}

export default TripEditForm