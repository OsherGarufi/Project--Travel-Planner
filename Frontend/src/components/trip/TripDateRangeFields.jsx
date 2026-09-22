import '../../css/components/trip-date-range-fields.css'

function TripDateRangeFields({
  startDate,
  endDate,
  startDateMinimum = '',
  endDateMinimum = '',
  startDateId = 'trip-start-date',
  endDateId = 'trip-end-date',
  disabled = false,
  className = '',
  onStartDateChange,
  onEndDateChange,
}) {
  const rootClassName = [
    'trip-date-range-fields',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName}>
      <div className="trip-date-range-fields__field">
        <label
          className="trip-date-range-fields__label"
          htmlFor={startDateId}
        >
          Start date
        </label>

        <input
          id={startDateId}
          className="trip-date-range-fields__input"
          type="date"
          value={startDate}
          min={startDateMinimum || undefined}
          disabled={disabled}
          required
          onChange={onStartDateChange}
        />
      </div>

      <div className="trip-date-range-fields__field">
        <label
          className="trip-date-range-fields__label"
          htmlFor={endDateId}
        >
          End date
        </label>

        <input
          id={endDateId}
          className="trip-date-range-fields__input"
          type="date"
          value={endDate}
          min={endDateMinimum || undefined}
          disabled={disabled}
          required
          onChange={onEndDateChange}
        />
      </div>
    </div>
  )
}

export default TripDateRangeFields
