import {
    ITINERARY_SNAP_MINUTES,
} from './itineraryConstants'

export function parseDateOnly(
  value,
) {
  if (!value) {
    return null
  }

  const [
    year,
    month,
    day,
  ] = value
    .slice(0, 10)
    .split('-')
    .map(Number)

  if (
    !year ||
    !month ||
    !day
  ) {
    return null
  }

  return new Date(
    year,
    month - 1,
    day,
    12,
  )
}

export function toDateOnlyValue(
  date,
) {
  if (!(date instanceof Date)) {
    return ''
  }

  const year =
    date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function createTripDays(
  startDateValue,
  endDateValue,
) {
  const startDate =
    parseDateOnly(startDateValue)

  const endDate =
    parseDateOnly(endDateValue)

  if (
    !startDate ||
    !endDate ||
    endDate < startDate
  ) {
    return []
  }

  const days = []

  const currentDate =
    new Date(startDate)

  while (
    currentDate <= endDate
  ) {
    const date =
      new Date(currentDate)

    days.push({
      dateValue:
        toDateOnlyValue(date),

      weekday:
        new Intl.DateTimeFormat(
          'en-US',
          {
            weekday: 'short',
          },
        ).format(date),

      shortDate:
        new Intl.DateTimeFormat(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
          },
        ).format(date),

      displayDate:
        new Intl.DateTimeFormat(
          'en-US',
          {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          },
        ).format(date),
    })

    currentDate.setDate(
      currentDate.getDate() + 1,
    )
  }

  return days
}

export function formatTripDateRange(
  startDateValue,
  endDateValue,
) {
  const startDate =
    parseDateOnly(startDateValue)

  const endDate =
    parseDateOnly(endDateValue)

  if (!startDate || !endDate) {
    return ''
  }

  const formatter =
    new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    )

  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`
}

export function parseTimeToMinutes(
  value,
) {
  if (!value) {
    return null
  }

  const [
    hours,
    minutes,
  ] = value
    .split(':')
    .map(Number)

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null
  }

  return (
    hours * 60 +
    minutes
  )
}

export function formatTime(
  value,
) {
  if (!value) {
    return ''
  }

  return value.slice(0, 5)
}

export function minutesToTimeValue(
  totalMinutes,
) {
  if (
    !Number.isFinite(totalMinutes)
  ) {
    return ''
  }

  const normalizedMinutes =
    Math.max(
      0,
      Math.min(
        totalMinutes,
        24 * 60 - 1,
      ),
    )

  const hours = Math.floor(
    normalizedMinutes / 60,
  )

  const minutes =
    normalizedMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function snapMinutesToInterval(
  totalMinutes,
) {
  if (
    !Number.isFinite(totalMinutes)
  ) {
    return 0
  }

  return Math.round(
    totalMinutes /
      ITINERARY_SNAP_MINUTES,
  ) *
    ITINERARY_SNAP_MINUTES
}