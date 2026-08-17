import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import HomeTripCard from '../components/home/HomeTripCard'
import NextTripCard from '../components/home/NextTripCard'
import TravelCarousel from '../components/home/TravelCarousel'
import TravelerRecommendations from '../components/home/TravelerRecommendations'
import '../css/pages/home-page.css'
import { useAuth } from '../hooks/useAuth'
import { useTrips } from '../hooks/useTrips'
import { getCountries } from '../services/countryService'

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

function PlaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m3 14 7.4-2.4V5.2c0-1 .7-2.2 1.6-2.2s1.6 1.2 1.6 2.2v6.4L21 14v1.7l-7.4-.8v4l2.2 1.4V22L12 21l-3.8 1v-1.7l2.2-1.4v-4l-7.4.8V14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
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

  return new Date(year, month - 1, day)
}

function getToday() {
  const today = new Date()

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
}

function HomePage() {
  const [countries, setCountries] =
    useState([])

  const {
    firebaseUser,
    backendUser,
  } = useAuth()

  const {
    trips,
    hasLoadedTrips,
    isLoadingTrips,
    tripsError,
    loadTrips,
  } = useTrips()

  const displayName =
    backendUser?.displayName ??
    firebaseUser?.displayName ??
    'Traveler'

  const firstName =
    displayName.trim().split(/\s+/)[0] ||
    'Traveler'

  useEffect(() => {
    if (hasLoadedTrips) {
      return
    }

    loadTrips().catch(() => {
      // TripsProvider exposes the user-facing error state.
    })
  }, [hasLoadedTrips, loadTrips])

  useEffect(() => {
    let isActive = true

    getCountries()
      .then((countriesResult) => {
        if (isActive) {
          setCountries(countriesResult)
        }
      })
      .catch(() => {
        // Flags are decorative.
      })

    return () => {
      isActive = false
    }
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
    nextTrip,
    previewTrips,
  } = useMemo(() => {
    const today = getToday()

    const futureTrips = trips
      .filter((trip) => {
        const startDate =
          getDateOnlyValue(trip.startDate)

        return startDate && startDate >= today
      })
      .sort((firstTrip, secondTrip) => {
        const firstDate =
          getDateOnlyValue(firstTrip.startDate)

        const secondDate =
          getDateOnlyValue(secondTrip.startDate)

        return firstDate - secondDate
      })

    const futureTripIds = new Set(
      futureTrips.map((trip) => trip.id),
    )

    const remainingTrips = trips.filter(
      (trip) => !futureTripIds.has(trip.id),
    )

    return {
      nextTrip: futureTrips[0] ?? null,
      previewTrips: [
        ...futureTrips,
        ...remainingTrips,
      ].slice(0, 3),
    }
  }, [trips])

  const hasTrips = trips.length > 0

  const getFlagUrl = (trip) => {
    const countryCode =
      trip.destinationCountryCode
        ?.toUpperCase()

    if (!countryCode) {
      return ''
    }

    return (
      countriesByCode.get(countryCode)
        ?.flagUrl ?? ''
    )
  }

  return (
    <div className="home-page">
      <section className="home-page__intro">
        <p className="home-page__eyebrow">
          YOUR TRAVEL SPACE
        </p>

        <h1 className="home-page__title">
          Welcome back, {firstName}.
        </h1>

        <p className="home-page__description">
          Keep your plans organized and your next
          journey within reach.
        </p>
      </section>

      <TravelCarousel />

      <section
        className="home-page__plan-card"
        aria-labelledby="home-plan-title"
      >
        <div className="home-page__plan-decoration">
          <span
            className="home-page__plan-icon"
            aria-hidden="true"
          >
            <PlaneIcon />
          </span>
        </div>

        <div className="home-page__plan-copy">
          <p className="home-page__plan-eyebrow">
            Start somewhere new
          </p>

          <h2
            id="home-plan-title"
            className="home-page__plan-title"
          >
            Where will your next trip take you?
          </h2>

          <p className="home-page__plan-description">
            Choose a destination, set your dates and
            bring the important details together in one
            place.
          </p>
        </div>

        <Link
          className="home-page__plan-button"
          to="/plan"
        >
          <span>Plan a new trip</span>

          <span
            className="home-page__plan-button-icon"
            aria-hidden="true"
          >
            <ArrowIcon />
          </span>
        </Link>
      </section>

      {nextTrip && (
        <NextTripCard
          trip={nextTrip}
          flagUrl={getFlagUrl(nextTrip)}
        />
      )}

      <section
        className="home-page__trips-section"
        aria-labelledby="home-trips-title"
      >
        <div className="home-page__section-header">
          <h2
            id="home-trips-title"
            className="home-page__section-title"
          >
            Your trips
          </h2>

          {hasTrips && (
            <Link
              className="home-page__view-all"
              to="/trips"
            >
              <span>View all</span>

              <span
                className="home-page__view-all-icon"
                aria-hidden="true"
              >
                <ArrowIcon />
              </span>
            </Link>
          )}
        </div>

        {tripsError && (
          <div
            className="home-page__error"
            role="alert"
          >
            {tripsError}
          </div>
        )}

        {!hasTrips && isLoadingTrips && (
          <div className="home-page__trip-grid">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="home-page__trip-skeleton"
                aria-hidden="true"
              >
                <span className="home-page__skeleton-line home-page__skeleton-line--short" />
                <span className="home-page__skeleton-line home-page__skeleton-line--title" />
                <span className="home-page__skeleton-line" />
              </div>
            ))}
          </div>
        )}

        {!isLoadingTrips &&
          hasLoadedTrips &&
          !hasTrips && (
            <div className="home-page__empty">
              <span
                className="home-page__empty-icon"
                aria-hidden="true"
              >
                <PlaneIcon />
              </span>

              <div className="home-page__empty-copy">
                <h3 className="home-page__empty-title">
                  No trips yet
                </h3>

                <p className="home-page__empty-description">
                  Your saved trips will appear here once
                  you start planning.
                </p>
              </div>

              <Link
                className="home-page__empty-link"
                to="/plan"
              >
                Plan your first trip
              </Link>
            </div>
          )}

        {hasTrips && (
          <div className="home-page__trip-grid">
            {previewTrips.map((trip) => (
              <HomeTripCard
                key={trip.id}
                trip={trip}
                flagUrl={getFlagUrl(trip)}
              />
            ))}
          </div>
        )}
      </section>

      <TravelerRecommendations />
    </div>
  )
}

export default HomePage