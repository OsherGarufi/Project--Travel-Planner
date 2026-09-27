import '../../css/components/trip-notes-view.css'

function TripNotesView({ notes, onEdit, onBack }) {
  return (
    <section
      className="trip-notes-view"
      aria-labelledby="trip-notes-view-title"
    >
      <div className="trip-notes-view__header">
        <p className="trip-notes-view__eyebrow">PERSONAL NOTES</p>
        <h1
          id="trip-notes-view-title"
          className="trip-notes-view__title"
        >
          Trip notes
        </h1>
      </div>

      <div className="trip-notes-view__content">{notes}</div>

      <div className="trip-notes-view__actions">
        <button
          className="trip-notes-view__back"
          type="button"
          onClick={onBack}
        >
          Back to trip
        </button>
        <button
          className="trip-notes-view__edit"
          type="button"
          onClick={onEdit}
        >
          Edit notes
        </button>
      </div>
    </section>
  )
}

export default TripNotesView
