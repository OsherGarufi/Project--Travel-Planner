import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import ItineraryItemForm from '../components/trip-itinerary/ItineraryItemForm'
import ItineraryWeekView from '../components/trip-itinerary/ItineraryWeekView'
import '../css/pages/trip-itinerary-page.css'
import {
  useTripDetails,
} from '../hooks/trip-details/useTripDetails'
import {
  useTripItinerary,
} from '../hooks/trip-itinerary/useTripItinerary'
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

function TripItineraryPage() {
  const navigate =
    useNavigate()

  const [
    weekStartIndex,
    setWeekStartIndex,
  ] = useState(0)

  const [
    isAddingActivity,
    setIsAddingActivity,
  ] = useState(false)

  const [
    editingItem,
    setEditingItem,
  ] = useState(null)

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
    itineraryActionError,

    isCreatingItineraryItem,
    isUpdatingItineraryItem,
    isUpdatingItinerarySchedule,
    isDeletingItineraryItem,

    addItineraryItem,
    updateItineraryItem,
    updateItinerarySchedule,
    deleteItineraryItem,

    clearItineraryActionError,
  } = useTripItinerary(
    tripId,
  )

  const isEditingActivity =
    Boolean(editingItem)

  const isActivityFormOpen =
    isAddingActivity ||
    isEditingActivity

  const isSubmittingActivity =
    isCreatingItineraryItem ||
    isUpdatingItineraryItem

  useEffect(() => {
    if (!isActivityFormOpen) {
      return undefined
    }

    const previousBodyOverflow =
      document.body.style.overflow

    const previousHtmlOverflow =
      document.documentElement
        .style
        .overflow

    document.body.style.overflow =
      'hidden'

    document.documentElement
      .style
      .overflow = 'hidden'

    return () => {
      document.body.style.overflow =
        previousBodyOverflow

      document.documentElement
        .style
        .overflow =
          previousHtmlOverflow
    }
  }, [
    isActivityFormOpen,
  ])

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
        (
          currentIndex,
        ) =>
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
        (
          currentIndex,
        ) =>
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

  const handleOpenAddActivity =
    () => {
      clearItineraryActionError()

      setEditingItem(null)
      setIsAddingActivity(true)
    }

  const handleOpenEditActivity =
    (item) => {
      if (!item?.id) {
        return
      }

      clearItineraryActionError()

      setIsAddingActivity(false)
      setEditingItem(item)
    }

  const handleCancelActivityForm =
    () => {
      if (
        isSubmittingActivity
      ) {
        return
      }

      clearItineraryActionError()

      setIsAddingActivity(false)
      setEditingItem(null)
    }

  const handleAddActivity =
    async (itemData) => {
      const createdItem =
        await addItineraryItem(
          itemData,
        )

      if (!createdItem) {
        return null
      }

      setIsAddingActivity(false)

      return createdItem
    }

  const handleUpdateActivity =
    async (itemData) => {
      if (!editingItem?.id) {
        return null
      }

      const updatedItem =
        await updateItineraryItem(
          editingItem.id,
          itemData,
        )

      if (!updatedItem) {
        return null
      }

      setEditingItem(null)

      return updatedItem
    }

  const handleMoveActivityToPlanLater =
    async (item) => {
      if (
        !item?.id ||
        isUpdatingItinerarySchedule
      ) {
        return null
      }

      clearItineraryActionError()

      return updateItinerarySchedule(
        item.id,
        {
          itineraryDate: null,
          startTime: null,
          endTime: null,
        },
      )
    }

  const handleDeleteActivity =
    async (item) => {
      if (
        !item?.id ||
        isDeletingItineraryItem
      ) {
        return false
      }

      clearItineraryActionError()

      return deleteItineraryItem(
        item.id,
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
    <main
      className={
        isActivityFormOpen
          ? 'trip-itinerary-page trip-itinerary-page--adding'
          : 'trip-itinerary-page'
      }
    >
      {!isActivityFormOpen && (
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

          <button
            className="trip-itinerary-page__add"
            type="button"
            onClick={
              handleOpenAddActivity
            }
          >
            <span
              className="trip-itinerary-page__add-icon"
              aria-hidden="true"
            >
              <PlusIcon />
            </span>

            <span>
              Add activity
            </span>
          </button>
        </div>
      )}

      {isActivityFormOpen && (
        <ItineraryItemForm
          key={
            editingItem?.id ??
            'new-activity'
          }
          initialItem={
            editingItem
          }
          initialDate={
            visibleDays[0]
              ?.dateValue ??
            trip.startDate
          }
          minDate={
            trip.startDate
          }
          maxDate={
            trip.endDate
          }
          isSubmitting={
            isSubmittingActivity
          }
          externalError={
            itineraryActionError
          }
          onSubmit={
            isEditingActivity
              ? handleUpdateActivity
              : handleAddActivity
          }
          onCancel={
            handleCancelActivityForm
          }
        />
      )}

      <div
        className={
          isActivityFormOpen
            ? 'trip-itinerary-page__week-view trip-itinerary-page__week-view--hidden'
            : 'trip-itinerary-page__week-view'
        }
      >
        <ItineraryWeekView
          title={
            trip.title
          }
          dateRange={
            formatTripDateRange(
              trip.startDate,
              trip.endDate,
            )
          }
          days={
            visibleDays
          }
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
          onEditItem={
            handleOpenEditActivity
          }
          onMoveItemToPlanLater={
            handleMoveActivityToPlanLater
          }
          onDeleteItem={
            handleDeleteActivity
          }
          isDeletingItem={
            isDeletingItineraryItem
          }
          actionError={
            itineraryActionError
          }
        />
      </div>
    </main>
  )
}

export default TripItineraryPage