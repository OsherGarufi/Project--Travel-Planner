import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import DailyTravelTipCard from '../components/home/DailyTravelTipCard'
import NextTripCard from '../components/home/NextTripCard'
import TravelCarousel from '../components/home/TravelCarousel'
import '../css/pages/home-page.css'
import { useAuth } from '../hooks/useAuth'
import { useTrips } from '../hooks/useTrips'
import { getCountries } from '../services/countryService'
import { getDailyTravelTip } from '../services/dailyTravelTipService'

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

  const [dailyTravelTip, setDailyTravelTip] =
    useState(null)

  const [isLoadingDailyTravelTip, setIsLoadingDailyTravelTip] =
    useState(true)

  const {
    firebaseUser,
    backendUser,
  } = useAuth()

  const {
    trips,
    hasLoadedTrips,
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

  useEffect(() => {
    let isActive = true

    getDailyTravelTip()
      .then((tip) => {
        if (isActive) {
          setDailyTravelTip(tip)
        }
      })
      .catch(() => {
        if (isActive) {
          setDailyTravelTip(null)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingDailyTravelTip(false)
        }
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

  const nextTrip = useMemo(() => {
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

    return futureTrips[0] ?? null
  }, [trips])

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
        <h1 className="home-page__title">
          Welcome {firstName}
        </h1>

        <p className="home-page__description">
          Keep your plans organized and your next
          journey within reach.
        </p>
      </section>

      <TravelCarousel />

      <DailyTravelTipCard
        tip={dailyTravelTip}
        isLoading={isLoadingDailyTravelTip}
      />

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
    </div>
  )
}

export default HomePage
