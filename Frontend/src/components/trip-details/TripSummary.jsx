function TripSummary({ trip }) {
  return (
    <>
      <h1>{trip.title}</h1>

      <section className="trip-details-page__summary">
        <h2>Trip Summary</h2>

        <p>
          Destination: {trip.destinationCity},{' '}
          {trip.destinationCountryName}
        </p>

        <p>
          Dates: {trip.startDate} - {trip.endDate}
        </p>

        {trip.budgetAmount !== null && (
          <p>
            Budget: {trip.budgetAmount}{' '}
            {trip.budgetCurrency}
          </p>
        )}

        {trip.notes && (
          <div>
            <h3>Notes</h3>
            <p>{trip.notes}</p>
          </div>
        )}
      </section>
    </>
  )
}

export default TripSummary