function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M13.5 6.5 17.5 10.5M5 19l3.5-.8L18.8 6.9a2.1 2.1 0 0 0-3-3L5.8 14.2 5 19Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlanLaterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 7 4 12l5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 12h8a6 6 0 0 1 6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DeleteIcon() {
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

function ItineraryItemActions({
  onEdit,
  onMoveToPlanLater,
  onDelete,
}) {
  const handleActionClick = (
    event,
    action,
  ) => {
    event.stopPropagation()
    action?.()
  }

  return (
    <div
      className="itinerary-week__item-actions"
      aria-label="Activity actions"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        className="itinerary-week__item-action"
        type="button"
        title="Edit activity"
        aria-label="Edit activity"
        onClick={(event) =>
          handleActionClick(
            event,
            onEdit,
          )
        }
      >
        <EditIcon />
      </button>

      {onMoveToPlanLater && (
        <button
          className="itinerary-week__item-action"
          type="button"
          title="Move to Plan later"
          aria-label="Move to Plan later"
          onClick={(event) =>
            handleActionClick(
              event,
              onMoveToPlanLater,
            )
          }
        >
          <PlanLaterIcon />
        </button>
      )}

      <button
        className="itinerary-week__item-action itinerary-week__item-action--danger"
        type="button"
        title="Delete activity"
        aria-label="Delete activity"
        onClick={(event) =>
          handleActionClick(
            event,
            onDelete,
          )
        }
      >
        <DeleteIcon />
      </button>
    </div>
  )
}

export default ItineraryItemActions