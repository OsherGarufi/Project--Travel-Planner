function DeleteTripSection({
  isConfirmingDelete,
  isDeleting,
  deleteError,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  return (
    <section className="delete-trip-section">
      <h2>Delete Trip</h2>

      {!isConfirmingDelete ? (
        <>
          <p>
            Permanently delete this trip and all of its
            saved details.
          </p>

          <button
            type="button"
            onClick={onStartDelete}
          >
            Delete Trip
          </button>
        </>
      ) : (
        <>
          <p>
            Are you sure you want to delete this trip?
            This action cannot be undone.
          </p>

          <div className="delete-trip-section__actions">
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? 'Deleting Trip...'
                : 'Yes, Delete Trip'}
            </button>

            <button
              type="button"
              onClick={onCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {deleteError && (
        <p className="delete-trip-section__error">
          {deleteError}
        </p>
      )}
    </section>
  )
}

export default DeleteTripSection