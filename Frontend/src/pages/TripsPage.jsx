import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getTrips } from '../services/tripService'

function TripsPage() {
  const { idToken } = useAuth()

  const [trips, setTrips] = useState([])
  const [isLoadingTrips, setIsLoadingTrips] = useState(true)
  const [tripsError, setTripsError] = useState('')

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setIsLoadingTrips(true)
        setTripsError('')

        const tripsResult = await getTrips(idToken)

        setTrips(tripsResult)
      } catch (error) {
        console.error('Failed to load trips:', error)

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
      <main>
        <p>Loading trips...</p>
      </main>
    )
  }

  return (
    <main>
      <h1>My Trips</h1>

      {tripsError && <p>{tripsError}</p>}

      {!tripsError && trips.length === 0 && (
        <p>You do not have any trips yet.</p>
      )}

      {!tripsError && trips.length > 0 && (
        <div>
          {trips.map((trip) => (
            <article key={trip.id}>
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
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

export default TripsPage