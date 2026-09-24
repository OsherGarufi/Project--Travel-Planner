import { useState } from 'react'
import '../../css/components/trip-date-range-fields.css'
import DatePickerField from './DatePickerField'

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
  const [openField, setOpenField] =
    useState(null)

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

        <DatePickerField
          id={startDateId}
          label="Start date"
          value={startDate}
          minimum={startDateMinimum}
          disabled={disabled}
          isOpen={openField === 'start'}
          onToggle={() =>
            setOpenField((currentField) =>
              currentField === 'start'
                ? null
                : 'start',
            )
          }
          onClose={() => setOpenField(null)}
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

        <DatePickerField
          id={endDateId}
          label="End date"
          value={endDate}
          minimum={endDateMinimum}
          disabled={disabled}
          isOpen={openField === 'end'}
          onToggle={() =>
            setOpenField((currentField) =>
              currentField === 'end'
                ? null
                : 'end',
            )
          }
          onClose={() => setOpenField(null)}
          onChange={onEndDateChange}
        />
      </div>
    </div>
  )
}

export default TripDateRangeFields
