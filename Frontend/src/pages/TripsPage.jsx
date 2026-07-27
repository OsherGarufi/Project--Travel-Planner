import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTrips } from '../services/tripService'

function TripsPage() {
  const { idToken } = useAuth()
  const navigate = useNavigate()

  const [trips, setTrips] = useState([])
  const [isLoadingTrips, setIsLoadingTrips] =
    useState(true)
  const [tripsError, setTripsError] =
    useState('')

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setIsLoadingTrips(true)
        setTripsError('')

        const tripsResult = await getTrips(idToken)

        setTrips(tripsResult)
      } catch (error) {
        console.error(
          'Failed to load trips:',
          error,
        )

        setTripsError(
          'Could not load your trips. Please try again.',
        )
      } finally {
        setIsLoadingTrips(false)
      }
    }

    if (idToken) {
      loadTrips()
    }
  }, [idToken])

  if (isLoadingTrips) {
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

      {!tripsError && trips.length === 0 && (
        <p>You do not have any trips yet.</p>
      )}

      {!tripsError && trips.length > 0 && (
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