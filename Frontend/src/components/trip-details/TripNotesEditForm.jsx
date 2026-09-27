import { useEffect, useRef } from 'react'
import '../../css/components/trip-notes-edit-form.css'

function TripNotesEditForm({
  notes,
  hasChanges,
  isSaving,
  saveError,
  isOrganizing,
  organizeError,
  canOrganize,
  aiResult,
  notesMode,
  canUndoAi,
  onNotesChange,
  onSave,
  onCancel,
  onOrganize,
  onApplyAi,
  onRestoreAi,
}) {
  const previewTitleRef = useRef(null)

  useEffect(() => {
    if (notesMode === 'preview') {
      previewTitleRef.current?.focus()
    }
  }, [notesMode])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (hasChanges && !isSaving && !isOrganizing) {
      onSave()
    }
  }

  if (notesMode === 'preview') {
    return (
      <section
        className="trip-notes-edit-form"
        aria-labelledby="trip-notes-preview-title"
      >
        <p className="trip-notes-edit-form__eyebrow">AI PREVIEW</p>
        <h1
          id="trip-notes-preview-title"
          className="trip-notes-edit-form__title"
          ref={previewTitleRef}
          tabIndex="-1"
        >
          Review organized notes
        </h1>
        <p className="trip-notes-edit-form__description">
          AI-generated organization. Review the result before applying it.
        </p>

        <div className="trip-notes-edit-form__preview">{aiResult}</div>

        <div className="trip-notes-edit-form__actions">
          <button
            className="trip-notes-edit-form__cancel"
            type="button"
            onClick={onRestoreAi}
          >
            Restore previous
          </button>
          <button
            className="trip-notes-edit-form__save"
            type="button"
            onClick={onApplyAi}
          >
            Apply changes
          </button>
        </div>
      </section>
    )
  }

  return (
    <section
      className="trip-notes-edit-form"
      aria-labelledby="trip-notes-edit-title"
    >
      <div className="trip-notes-edit-form__header">
        <div>
          <p className="trip-notes-edit-form__eyebrow">PERSONAL NOTES</p>
          <h1
            id="trip-notes-edit-title"
            className="trip-notes-edit-form__title"
          >
            Edit trip notes
          </h1>
          <p className="trip-notes-edit-form__description">
            Update your personal notes for this trip.
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
            maxLength={10000}
            rows={8}
            placeholder="Add notes about your trip"
            disabled={isSaving || isOrganizing}
            autoFocus
          />
        </div>

        <div className="trip-notes-edit-form__ai-actions">
          <button
            className="trip-notes-edit-form__organize"
            type="button"
            onClick={onOrganize}
            disabled={!canOrganize}
          >
            {isOrganizing ? 'Organizing notes...' : 'Organize with AI'}
          </button>
          {canUndoAi && (
            <button
              className="trip-notes-edit-form__undo"
              type="button"
              onClick={onRestoreAi}
              disabled={isSaving || isOrganizing}
            >
              Undo AI changes
            </button>
          )}
        </div>

        {organizeError && (
          <p className="trip-notes-edit-form__error" role="alert">
            {organizeError}
          </p>
        )}
        {saveError && (
          <p className="trip-notes-edit-form__error" role="alert">
            {saveError}
          </p>
        )}

        <div className="trip-notes-edit-form__actions">
          <button
            className="trip-notes-edit-form__cancel"
            type="button"
            onClick={onCancel}
            disabled={isSaving || isOrganizing}
          >
            Cancel
          </button>
          <button
            className="trip-notes-edit-form__save"
            type="submit"
            disabled={!hasChanges || isSaving || isOrganizing}
          >
            {isSaving ? 'Saving notes...' : 'Save notes'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default TripNotesEditForm
