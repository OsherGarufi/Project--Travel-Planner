function getValue(
  overrides,
  key,
  fallbackValue,
) {
  return Object.prototype.hasOwnProperty.call(
    overrides,
    key,
  )
    ? overrides[key]
    : fallbackValue
}

export function buildTripUpdatePayload(
  trip,
  overrides = {},
) {
  return {
    title: getValue(
      overrides,
      'title',
      trip.title,
    ),

    destinationCountryCode: getValue(
      overrides,
      'destinationCountryCode',
      trip.destinationCountryCode,
    ),

    destinationCountryName: getValue(
      overrides,
      'destinationCountryName',
      trip.destinationCountryName,
    ),

    destinationCity: getValue(
      overrides,
      'destinationCity',
      trip.destinationCity,
    ),

    startDate: getValue(
      overrides,
      'startDate',
      trip.startDate,
    ),

    endDate: getValue(
      overrides,
      'endDate',
      trip.endDate,
    ),

    budgetAmount: getValue(
      overrides,
      'budgetAmount',
      trip.budgetAmount,
    ),

    budgetCurrency: getValue(
      overrides,
      'budgetCurrency',
      trip.budgetCurrency,
    ),

    notes: getValue(
      overrides,
      'notes',
      trip.notes ?? null,
    ),
  }
}