function CreateTripSection({
  countryName,
  cityName,
  startDate,
  endDate,
  isCreatingTrip,
  isCreateDisabled,
  createTripError,
  onCreateTrip,
}) {
  const hasTripSummary =
    countryName &&
    cityName &&
    startDate &&
    endDate

  return (
    <section className="create-trip-section">
      <h2>Create Your Trip</h2>

      {hasTripSummary ? (
        <div className="create-trip-section__summary">
          <p>
            Destination: {cityName}, {countryName}
          </p>

          <p>
            Dates: {startDate} - {endDate}
          </p>
        </div>
      ) : (
        <p>
          Choose a country, city, and travel dates to
          create your trip.
        </p>
      )}

      <button
        type="button"
        onClick={onCreateTrip}
        disabled={isCreateDisabled}
      >
        {isCreatingTrip
          ? 'Creating Trip...'
          : 'Create Trip'}
      </button>

      {createTripError && (
        <p className="create-trip-section__error">
          {createTripError}
        </p>
      )}
    </section>
  )
}

export default CreateTripSection