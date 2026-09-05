function ExpenseDeleteConfirmation({
  expense,
  isDeleting = false,
  error = '',
  onCancel,
  onDelete,
}) {
  const isLinkedToItinerary =
    Boolean(
      expense?.itineraryItemId,
    )

  return (
    <div
      className={
        isLinkedToItinerary
          ? 'trip-expenses__delete-confirmation trip-expenses__delete-confirmation--linked'
          : 'trip-expenses__delete-confirmation'
      }
    >
      <p className="trip-expenses__delete-message">
        {isLinkedToItinerary
          ? 'This expense is linked to an itinerary activity. What would you like to delete?'
          : 'Delete this expense?'}
      </p>

      {error && (
        <p
          className="trip-expenses__delete-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="trip-expenses__delete-actions">
        <button
          className="trip-expenses__delete-cancel"
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </button>

        {isLinkedToItinerary ? (
          <>
            <button
              className="trip-expenses__delete-expense-only"
              type="button"
              onClick={() =>
                onDelete(false)
              }
              disabled={isDeleting}
            >
              {isDeleting
                ? 'Deleting...'
                : 'Delete expense only'}
            </button>

            <button
              className="trip-expenses__delete-confirm"
              type="button"
              onClick={() =>
                onDelete(true)
              }
              disabled={isDeleting}
            >
              {isDeleting
                ? 'Deleting...'
                : 'Delete expense & activity'}
            </button>
          </>
        ) : (
          <button
            className="trip-expenses__delete-confirm"
            type="button"
            onClick={() =>
              onDelete(null)
            }
            disabled={isDeleting}
          >
            {isDeleting
              ? 'Deleting...'
              : 'Delete'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ExpenseDeleteConfirmation