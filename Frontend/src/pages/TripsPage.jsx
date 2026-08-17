import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import TripsCarousel from '../components/trips/TripsCarousel'
import { useTrips } from '../hooks/useTrips'
import { getCountries } from '../services/countryService'
import '../css/pages/trips-page.css'

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 12h14M14 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="10"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function getDateOnlyValue(dateValue) {
  if (!dateValue) {
    return null
  }

  const [year, month, day] = dateValue
    .slice(0, 10)
    .split('-')
    .map(Number)

  return new Date(
    year,
    month - 1,
    day,
  )
}

function getToday() {
  const today = new Date()

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
}

function TripsLoadingState() {
  return (
    <div
      className="trips-page__loading-grid"
      aria-hidden="true"
    >
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="trips-page__skeleton"
        >
          <div className="trips-page__skeleton-top">
            <span className="trips-page__skeleton-icon" />
            <span className="trips-page__skeleton-badge" />
          </div>

          <span className="trips-page__skeleton-line trips-page__skeleton-line--title" />
          <span className="trips-page__skeleton-line" />
          <span className="trips-page__skeleton-line trips-page__skeleton-line--short" />
        </div>
      ))}
    </div>
  )
}

function TripsPage() {
  const [countries, setCountries] =
    useState([])

  const {
    trips,
    hasLoadedTrips,
    isLoadingTrips,
    tripsError,
    loadTrips,
  } = useTrips()

  useEffect(() => {
    if (hasLoadedTrips) {
      return
    }

    loadTrips().catch(() => {
      // TripsProvider exposes the user-facing error.
    })
  }, [
    hasLoadedTrips,
    loadTrips,
  ])

  useEffect(() => {
    getCountries()
      .then((countriesResult) => {
        setCountries(countriesResult)
      })
      .catch(() => {
        /*
         * Country data is only used here to decorate
         * trip cards with flags.
         *
         * Trips must remain usable even if country
         * metadata cannot be loaded.
         */
      })
  }, [])

  const countriesByCode =
    useMemo(() => {
      return new Map(
        countries.map((country) => [
          country.code?.toUpperCase(),
          country,
        ]),
      )
    }, [countries])

  const {
    currentTrips,
    upcomingTrips,
    pastTrips,
  } = useMemo(() => {
    const today = getToday()

    const current = []
    const upcoming = []
    const past = []

    trips.forEach((trip) => {
      const startDate =
        getDateOnlyValue(
          trip.startDate,
        )

      const endDate =
        getDateOnlyValue(
          trip.endDate,
        )

      if (
        startDate &&
        endDate &&
        startDate <= today &&
        endDate >= today
      ) {
        current.push(trip)
        return
      }

      if (
        startDate &&
        startDate > today
      ) {
        upcoming.push(trip)
        return
      }

      past.push(trip)
    })

    current.sort(
      (firstTrip, secondTrip) =>
        getDateOnlyValue(
          firstTrip.startDate,
        ) -
        getDateOnlyValue(
          secondTrip.startDate,
        ),
    )

    upcoming.sort(
      (firstTrip, secondTrip) =>
        getDateOnlyValue(
          firstTrip.startDate,
        ) -
        getDateOnlyValue(
          secondTrip.startDate,
        ),
    )

    past.sort(
      (firstTrip, secondTrip) => {
        const firstDate =
          getDateOnlyValue(
            firstTrip.endDate,
          )

        const secondDate =
          getDateOnlyValue(
            secondTrip.endDate,
          )

        return (
          (secondDate?.getTime() ?? 0) -
          (firstDate?.getTime() ?? 0)
        )
      },
    )

    return {
      currentTrips: current,
      upcomingTrips: upcoming,
      pastTrips: past,
    }
  }, [trips])

  const hasTrips =
    trips.length > 0

  const retryLoadTrips = () => {
    loadTrips({
      forceRefresh: true,
    }).catch(() => {
      // TripsProvider exposes the user-facing error.
    })
  }

  return (
    <div className="trips-page">
      <header className="trips-page__header">
        <div>
          <p className="trips-page__eyebrow">
            MY TRIPS
          </p>

          <h1 className="trips-page__title">
            Your Trips
          </h1>

          <p className="trips-page__description">
            View your current plans, upcoming
            adventures and previous trips in one
            place.
          </p>
        </div>

        <Link
          className="trips-page__plan-button"
          to="/plan"
        >
          <span
            className="trips-page__plan-button-icon"
            aria-hidden="true"
          >
            <PlusIcon />
          </span>

          <span>Plan a new trip</span>
        </Link>
      </header>

      {isLoadingTrips &&
        !hasLoadedTrips && (
          <TripsLoadingState />
        )}

      {tripsError &&
        !hasLoadedTrips && (
          <section className="trips-page__error-state">
            <div>
              <h2 className="trips-page__error-title">
                We couldn't load your trips
              </h2>

              <p className="trips-page__error-description">
                Something went wrong while loading
                your saved trips.
              </p>

              <p className="trips-page__error-message">
                {tripsError}
              </p>
            </div>

            <button
              className="trips-page__retry-button"
              type="button"
              onClick={retryLoadTrips}
              disabled={isLoadingTrips}
            >
              {isLoadingTrips
                ? 'Trying again...'
                : 'Try again'}
            </button>
          </section>
        )}

      {tripsError &&
        hasLoadedTrips && (
          <p
            className="trips-page__inline-error"
            role="alert"
          >
            {tripsError}
          </p>
        )}

      {hasLoadedTrips &&
        !isLoadingTrips &&
        !hasTrips && (
          <section className="trips-page__empty">
            <div
              className="trips-page__empty-icon"
              aria-hidden="true"
            >
              <LocationIcon />
            </div>

            <div>
              <p className="trips-page__empty-eyebrow">
                START YOUR TRIPS
              </p>

              <h2 className="trips-page__empty-title">
                No trips yet
              </h2>

              <p className="trips-page__empty-description">
                Your saved journeys will appear
                here once you plan your first trip.
              </p>
            </div>

            <Link
              className="trips-page__empty-button"
              to="/plan"
            >
              <span>
                Plan your first trip
              </span>

              <span
                className="trips-page__empty-button-icon"
                aria-hidden="true"
              >
                <ArrowIcon />
              </span>
            </Link>
          </section>
        )}

      {hasTrips && (
        <div className="trips-page__sections">
          <TripsCarousel
            title="Current trips"
            description="Trips that are happening right now."
            trips={currentTrips}
            status="current"
            countriesByCode={
              countriesByCode
            }
          />

          <TripsCarousel
            title="Upcoming trips"
            description="Your next planned trips."
            trips={upcomingTrips}
            status="upcoming"
            countriesByCode={
              countriesByCode
            }
          />

          <TripsCarousel
            title="Past trips"
            description="Previous trips you've saved."
            trips={pastTrips}
            status="past"
            countriesByCode={
              countriesByCode
            }
          />
        </div>
      )}
    </div>
  )
}

export default TripsPage