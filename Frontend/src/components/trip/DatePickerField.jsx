import {
  useEffect,
  useRef,
  useState,
} from 'react'
import '../../css/components/date-picker-field.css'
import { formatDateForInput } from '../../utils/dateUtils'

const WEEKDAY_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
]

const displayDateFormatter =
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

const monthFormatter =
  new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  })

const ariaDateFormatter =
  new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

function parseLocalDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null
  }

  const [year, month, day] = value
    .split('-')
    .map(Number)

  const date = new Date(
    year,
    month - 1,
    day,
  )

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function getMonthStart(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  )
}

function getInitialMonth(value, minimum) {
  return getMonthStart(
    parseLocalDate(value) ||
      parseLocalDate(minimum) ||
      new Date(),
  )
}

function getCalendarDays(month) {
  const firstGridDate = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - month.getDay(),
  )

  return Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        firstGridDate.getFullYear(),
        firstGridDate.getMonth(),
        firstGridDate.getDate() + index,
      ),
  )
}

function isSameLocalDay(firstDate, secondDate) {
  return Boolean(
    firstDate &&
      secondDate &&
      firstDate.getFullYear() ===
        secondDate.getFullYear() &&
      firstDate.getMonth() ===
        secondDate.getMonth() &&
      firstDate.getDate() ===
        secondDate.getDate(),
  )
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 3v4M16 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronIcon({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          direction === 'previous'
            ? 'M15 6 9 12l6 6'
            : 'm9 6 6 6-6 6'
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DatePickerField({
  id,
  label,
  value,
  minimum = '',
  disabled = false,
  isOpen,
  onToggle,
  onClose,
  onChange,
}) {
  const rootRef = useRef(null)
  const controlRef = useRef(null)

  const [displayedMonth, setDisplayedMonth] =
    useState(() =>
      getInitialMonth(value, minimum),
    )

  const selectedDate = parseLocalDate(value)
  const minimumDate = parseLocalDate(minimum)
  const today = parseLocalDate(
    formatDateForInput(new Date()),
  )

  const calendarId = `${id}-calendar`
  const monthLabelId = `${id}-month-label`

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (
        !rootRef.current?.contains(
          event.target,
        )
      ) {
        onClose()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      onClose()
      controlRef.current?.focus()
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    )
    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [isOpen, onClose])

  const changeMonth = (offset) => {
    setDisplayedMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + offset,
          1,
        ),
    )
  }

  const handleToggle = () => {
    if (!isOpen) {
      setDisplayedMonth(
        getInitialMonth(value, minimum),
      )
    }

    onToggle()
  }

  const selectDate = (date) => {
    const nextValue = formatDateForInput(date)

    onChange({
      target: {
        value: nextValue,
      },
    })

    onClose()
    controlRef.current?.focus()
  }

  const calendarDays =
    getCalendarDays(displayedMonth)

  const displayedValue = selectedDate
    ? displayDateFormatter.format(selectedDate)
    : 'Select a date'

  return (
    <div
      ref={rootRef}
      className="date-picker-field"
    >
      <button
        ref={controlRef}
        id={id}
        className="date-picker-field__control"
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={
          isOpen ? calendarId : undefined
        }
        aria-required="true"
        onClick={handleToggle}
      >
        <span
          className={`date-picker-field__value${
            selectedDate
              ? ''
              : ' date-picker-field__value--placeholder'
          }`}
        >
          {displayedValue}
        </span>

        <span className="date-picker-field__icon">
          <CalendarIcon />
        </span>
      </button>

      {isOpen && (
        <div
          id={calendarId}
          className="date-picker-field__calendar"
          role="dialog"
          aria-modal="false"
          aria-label={`${label} calendar`}
          aria-labelledby={monthLabelId}
        >
          <div className="date-picker-field__calendar-header">
            <button
              className="date-picker-field__month-button"
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronIcon direction="previous" />
            </button>

            <p
              id={monthLabelId}
              className="date-picker-field__month-label"
              aria-live="polite"
            >
              {monthFormatter.format(
                displayedMonth,
              )}
            </p>

            <button
              className="date-picker-field__month-button"
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronIcon direction="next" />
            </button>
          </div>

          <div
            className="date-picker-field__weekdays"
            aria-hidden="true"
          >
            {WEEKDAY_LABELS.map((weekday) => (
              <span key={weekday}>
                {weekday}
              </span>
            ))}
          </div>

          <div className="date-picker-field__days">
            {calendarDays.map((date) => {
              const dateValue =
                formatDateForInput(date)

              const isOutsideMonth =
                date.getMonth() !==
                displayedMonth.getMonth()

              const isDisabled = Boolean(
                minimumDate &&
                  date.getTime() <
                    minimumDate.getTime(),
              )

              const isSelected =
                isSameLocalDay(
                  date,
                  selectedDate,
                )

              const isToday = isSameLocalDay(
                date,
                today,
              )

              const dayClassName = [
                'date-picker-field__day',
                isOutsideMonth
                  ? 'date-picker-field__day--outside'
                  : '',
                isSelected
                  ? 'date-picker-field__day--selected'
                  : '',
                isToday
                  ? 'date-picker-field__day--today'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={dateValue}
                  className={dayClassName}
                  type="button"
                  disabled={isDisabled}
                  aria-label={
                    ariaDateFormatter.format(date)
                  }
                  aria-selected={isSelected}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePickerField
