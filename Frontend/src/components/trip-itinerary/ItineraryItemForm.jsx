import {
    useState,
} from 'react'
import '../../css/components/itinerary-item-form.css'
import {
    ITINERARY_CATEGORIES,
} from '../../services/itinerary/itineraryConstants'

function toApiTimeValue(
  timeValue,
) {
  if (!timeValue) {
    return null
  }

  return `${timeValue}:00`
}

function ItineraryItemForm({
  initialDate,
  minDate,
  maxDate,
  isSubmitting,
  externalError,
  onSubmit,
  onCancel,
}) {
  const [
    title,
    setTitle,
  ] = useState('')

  const [
    category,
    setCategory,
  ] = useState('Activities')

  const [
    itineraryDate,
    setItineraryDate,
  ] = useState(
    initialDate ||
      minDate ||
      '',
  )

  const [
    startTime,
    setStartTime,
  ] = useState('')

  const [
    endTime,
    setEndTime,
  ] = useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    referenceUrl,
    setReferenceUrl,
  ] = useState('')

  const [
    validationError,
    setValidationError,
  ] = useState('')

  const handleSubmit =
    async (event) => {
      event.preventDefault()

      const normalizedTitle =
        title.trim()

      const normalizedDescription =
        description.trim()

      const normalizedReferenceUrl =
        referenceUrl.trim()

      if (!normalizedTitle) {
        setValidationError(
          'Please enter a title.',
        )

        return
      }

      if (!category) {
        setValidationError(
          'Please choose a category.',
        )

        return
      }

      if (!itineraryDate) {
        setValidationError(
          'Please choose a date.',
        )

        return
      }

      const hasStartTime =
        Boolean(startTime)

      const hasEndTime =
        Boolean(endTime)

      if (
        hasStartTime !==
        hasEndTime
      ) {
        setValidationError(
          'Choose both a start time and an end time, or leave both empty.',
        )

        return
      }

      if (
        hasStartTime &&
        endTime <= startTime
      ) {
        setValidationError(
          'End time must be later than start time.',
        )

        return
      }

      setValidationError('')

      await onSubmit({
        title:
          normalizedTitle,

        category,

        itineraryDate,

        startTime:
          toApiTimeValue(
            startTime,
          ),

        endTime:
          toApiTimeValue(
            endTime,
          ),

        description:
          normalizedDescription ||
          null,

        referenceUrl:
          normalizedReferenceUrl ||
          null,
      })
    }

  const displayedError =
    validationError ||
    externalError

  return (
    <section className="itinerary-item-form">
      <div className="itinerary-item-form__header">
        <div>
          <p className="itinerary-item-form__eyebrow">
            TRIP ITINERARY
          </p>

          <h1 className="itinerary-item-form__title">
            Add activity
          </h1>

          <p className="itinerary-item-form__description">
            Add something to your
            trip schedule now, or
            leave the time empty and
            plan it later.
          </p>
        </div>
      </div>

      <form
        className="itinerary-item-form__form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="itinerary-item-form__field itinerary-item-form__field--full">
          <label htmlFor="itinerary-title">
            Title
          </label>

          <input
            id="itinerary-title"
            type="text"
            value={title}
            maxLength={100}
            placeholder="e.g. Visit the museum"
            autoFocus
            disabled={
              isSubmitting
            }
            onChange={(
              event,
            ) =>
              setTitle(
                event.target.value,
              )
            }
          />
        </div>

        <div className="itinerary-item-form__field">
          <label htmlFor="itinerary-category">
            Category
          </label>

          <select
            id="itinerary-category"
            value={category}
            disabled={
              isSubmitting
            }
            onChange={(
              event,
            ) =>
              setCategory(
                event.target.value,
              )
            }
          >
            {ITINERARY_CATEGORIES.map(
              (
                categoryOption,
              ) => (
                <option
                  key={
                    categoryOption.key
                  }
                  value={
                    categoryOption.name
                  }
                >
                  {
                    categoryOption.name
                  }
                </option>
              ),
            )}
          </select>
        </div>

        <div className="itinerary-item-form__field">
          <label htmlFor="itinerary-date">
            Date
          </label>

          <input
            id="itinerary-date"
            type="date"
            value={
              itineraryDate
            }
            min={minDate}
            max={maxDate}
            disabled={
              isSubmitting
            }
            onChange={(
              event,
            ) =>
              setItineraryDate(
                event.target.value,
              )
            }
          />
        </div>

        <div className="itinerary-item-form__field">
          <label htmlFor="itinerary-start-time">
            Start time
          </label>

          <input
            id="itinerary-start-time"
            type="time"
            value={
              startTime
            }
            step={900}
            disabled={
              isSubmitting
            }
            onChange={(
              event,
            ) =>
              setStartTime(
                event.target.value,
              )
            }
          />

          <span className="itinerary-item-form__hint">
            Optional
          </span>
        </div>

        <div className="itinerary-item-form__field">
          <label htmlFor="itinerary-end-time">
            End time
          </label>

          <input
            id="itinerary-end-time"
            type="time"
            value={endTime}
            step={900}
            disabled={
              isSubmitting
            }
            onChange={(
              event,
            ) =>
              setEndTime(
                event.target.value,
              )
            }
          />

          <span className="itinerary-item-form__hint">
            Optional
          </span>
        </div>

        <div className="itinerary-item-form__field itinerary-item-form__field--full">
          <label htmlFor="itinerary-description">
            Description
          </label>

          <textarea
            id="itinerary-description"
            value={
              description
            }
            maxLength={2000}
            rows={4}
            placeholder="Notes, reservation details or anything useful for this activity..."
            disabled={
              isSubmitting
            }
            onChange={(
              event,
            ) =>
              setDescription(
                event.target.value,
              )
            }
          />

          <span className="itinerary-item-form__hint">
            Optional
          </span>
        </div>

        <div className="itinerary-item-form__field itinerary-item-form__field--full">
          <label htmlFor="itinerary-reference-url">
            Reference URL
          </label>

          <input
            id="itinerary-reference-url"
            type="url"
            value={
              referenceUrl
            }
            maxLength={2048}
            placeholder="https://..."
            disabled={
              isSubmitting
            }
            onChange={(
              event,
            ) =>
              setReferenceUrl(
                event.target.value,
              )
            }
          />

          <span className="itinerary-item-form__hint">
            Optional · tickets,
            booking, maps or website
          </span>
        </div>

        {displayedError && (
          <div
            className="itinerary-item-form__error"
            role="alert"
          >
            {displayedError}
          </div>
        )}

        <div className="itinerary-item-form__actions">
          <button
            className="itinerary-item-form__cancel"
            type="button"
            disabled={
              isSubmitting
            }
            onClick={
              onCancel
            }
          >
            Cancel
          </button>

          <button
            className="itinerary-item-form__submit"
            type="submit"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? 'Adding activity...'
              : 'Add activity'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ItineraryItemForm