import '../../css/components/trip-notes-edit-form.css'

function NotesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 8h8M8 12h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TripNotesEditForm({
  notes,
  hasChanges,
  isSaving,
  saveError,
  onNotesChange,
  onSave,
  onCancel,
}) {
  const handleSubmit = (
    event,
  ) => {
    event.preventDefault()

    if (
      hasChanges &&
      !isSaving
    ) {
      onSave()
    }
  }

  return (
    <section
      className="trip-notes-edit-form"
      aria-labelledby="trip-notes-edit-title"
    >
      <div className="trip-notes-edit-form__header">
        <span
          className="trip-notes-edit-form__header-icon"
          aria-hidden="true"
        >
          <NotesIcon />
        </span>

        <div>
          <p className="trip-notes-edit-form__eyebrow">
            PERSONAL NOTES
          </p>

          <h1
            id="trip-notes-edit-title"
            className="trip-notes-edit-form__title"
          >
            Edit trip notes
          </h1>

          <p className="trip-notes-edit-form__description">
            Update your personal notes
            for this trip.
          </p>
        </div>
      </div>

      <form
        className="trip-notes-edit-form__form"
        onSubmit={handleSubmit}
      >
        <div className="trip-notes-edit-form__field">
          <label
            className="trip-notes-edit-form__label"
            htmlFor="editTripNotes"
          >
            Notes
          </label>

          <textarea
            id="editTripNotes"
            className="trip-notes-edit-form__textarea"
            value={notes}
            onChange={onNotesChange}
            rows={8}
            placeholder="Add notes about your trip"
            autoFocus
          />
        </div>

        {saveError && (
          <p
            className="trip-notes-edit-form__error"
            role="alert"
          >
            {saveError}
          </p>
        )}

        <div className="trip-notes-edit-form__actions">
          <button
            className="trip-notes-edit-form__cancel"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            className="trip-notes-edit-form__save"
            type="submit"
            disabled={
              !hasChanges ||
              isSaving
            }
          >
            {isSaving
              ? 'Saving notes...'
              : 'Save notes'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default TripNotesEditForm