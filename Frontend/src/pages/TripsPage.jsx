import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrips } from '../hooks/useTrips'

function TripsPage() {
  const navigate = useNavigate()

  const {
    trips,
    hasLoadedTrips,
    isLoadingTrips,
    tripsError,
    loadTrips,
  } = useTrips()

  useEffect(() => {
    loadTrips().catch((error) => {
      console.error(
        'Failed to load trips:',
        error,
      )
    })
  }, [loadTrips])

  if (
    isLoadingTrips ||
    (!hasLoadedTrips && !tripsError)
  ) {
    return (
      <main className="trips-page">
        <button
          type="button"
          onClick={() => navigate('/home')}
        >
          Back to Dashboard
        </button>

        <p>Loading trips...</p>
      </main>
    )
  }

  if (tripsError && !hasLoadedTrips) {
    return (
      <main className="trips-page">
        <button
          type="button"
          onClick={() => navigate('/home')}
        >
          Back to Dashboard
        </button>

        <h1>My Trips</h1>

        <p className="trips-page__error">
          {tripsError}
        </p>

        <button
          type="button"
          onClick={() => {
            loadTrips().catch((error) => {
              console.error(
                'Failed to retry loading trips:',
                error,
              )
            })
          }}
        >
          Try Again
        </button>
      </main>
    )
  }

  return (
    <main className="trips-page">
      <button
        type="button"
        onClick={() => navigate('/home')}
      >
        Back to Dashboard
      </button>

      <h1>My Trips</h1>

      {tripsError && (
        <p className="trips-page__error">
          {tripsError}
        </p>
      )}

      {trips.length === 0 && (
        <p>You do not have any trips yet.</p>
      )}

      {trips.length > 0 && (
        <div className="trips-page__list">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="trips-page__trip-card"
            >
              <h2>{trip.title}</h2>

              <p>
                {trip.destinationCity},{' '}
                {trip.destinationCountryName}
              </p>

              <p>
                {trip.startDate} - {trip.endDate}
              </p>

              {trip.budgetAmount !== null && (
                <p>
                  Budget: {trip.budgetAmount}{' '}
                  {trip.budgetCurrency}
                </p>
              )}

              <button
                type="button"
                onClick={() =>
                  navigate(`/trips/${trip.id}`)
                }
              >
                Open Trip
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

export default TripsPage