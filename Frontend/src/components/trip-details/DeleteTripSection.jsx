import '../../css/components/delete-trip-section.css'

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 11v5M14 11v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3 2.8 20h18.4L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M12 9v5M12 17.5v.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DeleteTripSection({
  isConfirmingDelete,
  isDeleting,
  deleteError,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  return (
    <section
      className={`delete-trip-section${
        isConfirmingDelete
          ? ' delete-trip-section--confirming'
          : ''
      }`}
      aria-labelledby="delete-trip-title"
    >
      {!isConfirmingDelete ? (
        <>
          <div className="delete-trip-section__content">
            <span
              className="delete-trip-section__icon"
              aria-hidden="true"
            >
              <TrashIcon />
            </span>

            <div>
              <p className="delete-trip-section__eyebrow">
                DANGER ZONE
              </p>

              <h2
                id="delete-trip-title"
                className="delete-trip-section__title"
              >
                Delete trip
              </h2>

              <p className="delete-trip-section__description">
                Permanently remove this trip and all
                of its saved details.
              </p>
            </div>
          </div>

          <button
            className="delete-trip-section__start-button"
            type="button"
            onClick={onStartDelete}
          >
            Delete trip
          </button>
        </>
      ) : (
        <div className="delete-trip-section__confirmation">
          <div className="delete-trip-section__confirmation-header">
            <span
              className="delete-trip-section__warning-icon"
              aria-hidden="true"
            >
              <WarningIcon />
            </span>

            <div>
              <p className="delete-trip-section__confirmation-eyebrow">
                CONFIRM DELETION
              </p>

              <h2
                id="delete-trip-title"
                className="delete-trip-section__confirmation-title"
              >
                Delete this trip permanently?
              </h2>
            </div>
          </div>

          <p className="delete-trip-section__confirmation-description">
            This action cannot be undone. The trip
            will be permanently removed from My Trips.
          </p>

          {deleteError && (
            <p
              className="delete-trip-section__error"
              role="alert"
            >
              {deleteError}
            </p>
          )}

          <div className="delete-trip-section__actions">
            <button
              className="delete-trip-section__cancel-button"
              type="button"
              onClick={onCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </button>

            <button
              className="delete-trip-section__confirm-button"
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? 'Deleting trip...'
                : 'Yes, delete trip'}
            </button>
          </div>
        </div>
      )}

      {!isConfirmingDelete &&
        deleteError && (
          <p
            className="delete-trip-section__error"
            role="alert"
          >
            {deleteError}
          </p>
        )}
    </section>
  )
}

export default DeleteTripSection