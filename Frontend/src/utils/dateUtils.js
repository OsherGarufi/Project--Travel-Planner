function formatDatePart(value) {
  return String(value).padStart(2, '0')
}

export function formatDateForInput(date) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    throw new Error('A valid Date object is required.')
  }

  const year = date.getFullYear()
  const month = formatDatePart(
    date.getMonth() + 1,
  )
  const day = formatDatePart(date.getDate())

  return `${year}-${month}-${day}`
}

export function moveDateOneYearBack(date) {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error(
      'Date must use the YYYY-MM-DD format.',
    )
  }

  const [year, month, day] = date
    .split('-')
    .map(Number)

  const historicalYear = year - 1

  const lastDayOfHistoricalMonth =
    new Date(
      Date.UTC(historicalYear, month, 0),
    ).getUTCDate()

  const historicalDay = Math.min(
    day,
    lastDayOfHistoricalMonth,
  )

  return (
    `${historicalYear}-` +
    `${formatDatePart(month)}-` +
    `${formatDatePart(historicalDay)}`
  )
}