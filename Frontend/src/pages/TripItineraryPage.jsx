import {
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import ItineraryWeekView from '../components/trip-itinerary/ItineraryWeekView'
import '../css/pages/trip-itinerary-page.css'
import { useTripDetails } from '../hooks/trip-details/useTripDetails'
import { useTripItinerary } from '../hooks/trip-itinerary/useTripItinerary'
import {
  ITINERARY_DAYS_PER_WEEK,
} from '../services/itinerary/itineraryConstants'
import {
  createTripDays,
  formatTripDateRange,
} from '../services/itinerary/itineraryDateTimeUtils'

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M19 12H5M10 7l-5 5 5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TripItineraryPage() {
  const navigate = useNavigate()

  const [
    weekStartIndex,
    setWeekStartIndex,
  ] = useState(0)

  const {
    trip,
    tripId,
    isLoadingTrip,
    tripError,
  } = useTripDetails()

  const {
    itineraryItems,
    isLoadingItinerary,
    itineraryError,
  } = useTripItinerary(
    tripId,
  )

  const tripDays =
    useMemo(
      () =>
        createTripDays(
          trip?.startDate,
          trip?.endDate,
        ),
      [
        trip?.startDate,
        trip?.endDate,
      ],
    )

  const visibleDays =
    useMemo(
      () =>
        tripDays.slice(
          weekStartIndex,
          weekStartIndex +
            ITINERARY_DAYS_PER_WEEK,
        ),
      [
        tripDays,
        weekStartIndex,
      ],
    )

  const canGoPrevious =
    weekStartIndex > 0

  const canGoNext =
    weekStartIndex +
      ITINERARY_DAYS_PER_WEEK <
    tripDays.length

  const handlePreviousWeek =
    () => {
      setWeekStartIndex(
        (currentIndex) =>
          Math.max(
            0,
            currentIndex -
              ITINERARY_DAYS_PER_WEEK,
          ),
      )
    }

  const handleNextWeek =
    () => {
      setWeekStartIndex(
        (currentIndex) =>
          Math.min(
            Math.max(
              0,
              tripDays.length -
                ITINERARY_DAYS_PER_WEEK,
            ),
            currentIndex +
              ITINERARY_DAYS_PER_WEEK,
          ),
      )
    }

  if (
    isLoadingTrip ||
    isLoadingItinerary
  ) {
    return (
      <main className="trip-itinerary-page">
        <div className="trip-itinerary-page__loading">
          Loading itinerary...
        </div>
      </main>
    )
  }

  if (
    tripError ||
    itineraryError ||
    !trip
  ) {
    return (
      <main className="trip-itinerary-page">
        <section className="trip-itinerary-page__error-state">
          <h1 className="trip-itinerary-page__error-title">
            Itinerary unavailable
          </h1>

          <p className="trip-itinerary-page__error-description">
            {tripError ||
              itineraryError ||
              'Could not load this itinerary.'}
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="trip-itinerary-page">
      <div className="trip-itinerary-page__topbar">
        <button
          className="trip-itinerary-page__back"
          type="button"
          onClick={() =>
            navigate(
              `/trips/${trip.id}`,
            )
          }
        >
          <span
            className="trip-itinerary-page__back-icon"
            aria-hidden="true"
          >
            <ArrowLeftIcon />
          </span>

          <span>
            Back to trip
          </span>
        </button>
      </div>

      <ItineraryWeekView
        title={trip.title}
        dateRange={formatTripDateRange(
          trip.startDate,
          trip.endDate,
        )}
        days={visibleDays}
        itineraryItems={
          itineraryItems
        }
        canGoPrevious={
          canGoPrevious
        }
        canGoNext={
          canGoNext
        }
        onPreviousWeek={
          handlePreviousWeek
        }
        onNextWeek={
          handleNextWeek
        }
      />
    </main>
  )
}

export default TripItineraryPage