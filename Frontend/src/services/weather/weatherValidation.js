function normalizeCoordinate(
  value,
  coordinateName,
  minimumValue,
  maximumValue,
) {
  const normalizedValue = Number(value)

  if (!Number.isFinite(normalizedValue)) {
    throw new Error(
      `${coordinateName} must be a valid number.`,
    )
  }

  if (
    normalizedValue < minimumValue ||
    normalizedValue > maximumValue
  ) {
    throw new Error(
      `${coordinateName} is outside the valid range.`,
    )
  }

  return normalizedValue
}

export function normalizeCoordinates(
  latitude,
  longitude,
) {
  return {
    latitude: normalizeCoordinate(
      latitude,
      'Latitude',
      -90,
      90,
    ),
    longitude: normalizeCoordinate(
      longitude,
      'Longitude',
      -180,
      180,
    ),
  }
}

function normalizeDate(date, fieldName) {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error(
      `${fieldName} must use the YYYY-MM-DD format.`,
    )
  }

  const [year, month, day] = date
    .split('-')
    .map(Number)

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day),
  )

  const isValidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day

  if (!isValidDate) {
    throw new Error(
      `${fieldName} must be a valid date.`,
    )
  }

  return date
}

export function normalizeDateRange(
  startDate,
  endDate,
) {
  const normalizedStartDate = normalizeDate(
    startDate,
    'Start date',
  )

  const normalizedEndDate = normalizeDate(
    endDate,
    'End date',
  )

  if (normalizedEndDate < normalizedStartDate) {
    throw new Error(
      'End date cannot be earlier than start date.',
    )
  }

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
  }
}