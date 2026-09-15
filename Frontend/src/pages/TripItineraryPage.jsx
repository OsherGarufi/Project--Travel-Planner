import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'
import TripEntryForm from '../components/trip-entry/TripEntryForm'
import ItineraryItemForm from '../components/trip-itinerary/ItineraryItemForm'
import ItineraryWeekView from '../components/trip-itinerary/ItineraryWeekView'
import '../css/pages/trip-itinerary-page.css'
import {
  useTripDetails,
} from '../hooks/trip-details/useTripDetails'
import {
  useTripItinerary,
} from '../hooks/trip-itinerary/useTripItinerary'
import { safeAttractionUrl } from '../services/attractions/attractionsService'
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

  const location =
    useLocation()

  const consumedDrafts =
    useRef(new Set())

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

  const [
    attractionDraft,
    setAttractionDraft,
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
    queueItineraryScheduleUpdate,
    deleteItineraryItem,

    clearItineraryActionError,
  } = useTripItinerary(
    tripId,
  )

  useEffect(() => {
    if (
      !location.state ||
      typeof location.state !== 'object' ||
      !Object.hasOwn(
        location.state,
        'attractionDraft',
      ) ||
      isLoadingTrip ||
      isLoadingItinerary
    ) {
      return undefined
    }

    if (
      trip &&
      trip.id !== tripId &&
      !tripError
    ) {
      return undefined
    }

    const draft =
      location.state.attractionDraft

    const isObject =
      draft !== null &&
      typeof draft === 'object' &&
      !Array.isArray(draft)

    const placeId =
      isObject &&
      typeof draft.placeId === 'string'
        ? draft.placeId.trim()
        : ''

    const name =
      isObject &&
      typeof draft.name === 'string'
        ? draft.name.trim()
        : ''

    const isValid =
      isObject &&
      !tripError &&
      !itineraryError &&
      trip &&
      typeof draft.tripId === 'string' &&
      draft.tripId === trip.id &&
      trip.id === tripId &&
      placeId &&
      name &&
      (
        draft.description === undefined ||
        typeof draft.description === 'string'
      )

    let active = true

    queueMicrotask(() => {
      if (!active) {
        return
      }

      if (
        !consumedDrafts.current.has(
          location.key,
        )
      ) {
        consumedDrafts.current.add(
          location.key,
        )

        if (isValid) {
          clearItineraryActionError()

          setAttractionDraft({
            placeId,
            name,
            description:
              draft.description?.trim() ??
              '',
            website:
              safeAttractionUrl(
                draft.website,
              ),
            navigationKey:
              location.key,
          })

          setEditingItem(null)
          setIsAddingActivity(true)
        }
      }

      const remainingState = {
        ...location.state,
      }

      delete remainingState.attractionDraft

      navigate(
        location.pathname +
          location.search +
          location.hash,
        {
          replace: true,
          state:
            Object.keys(
              remainingState,
            ).length
              ? remainingState
              : null,
        },
      )
    })

    return () => {
      active = false
    }
  }, [
    location,
    navigate,
    trip,
    tripId,
    tripError,
    itineraryError,
    isLoadingTrip,
    isLoadingItinerary,
    clearItineraryActionError,
  ])

  const isEditingActivity =
    Boolean(editingItem)

  const isActivityFormOpen =
    isAddingActivity ||
    isEditingActivity

  const isSubmittingActivity =
    isCreatingItineraryItem ||
    isUpdatingItineraryItem

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

  const handleOpenAddActivity =
    () => {
      clearItineraryActionError()

      setAttractionDraft(null)
      setEditingItem(null)
      setIsAddingActivity(true)
    }

  const handleOpenEditActivity =
    (item) => {
      if (!item?.id) {
        return
      }

      clearItineraryActionError()

      setAttractionDraft(null)
      setIsAddingActivity(false)
      setEditingItem(item)
    }

  const handleCancelActivityForm =
    () => {
      if (isSubmittingActivity) {
        return
      }

      const shouldReturnToAttractions =
        Boolean(attractionDraft)

      clearItineraryActionError()

      setAttractionDraft(null)
      setIsAddingActivity(false)
      setEditingItem(null)

      if (shouldReturnToAttractions) {
        navigate(-1)
      }
    }

  const handleAddActivity =
    async (entryData) => {
      const shouldReturnToAttractions =
        Boolean(attractionDraft)

      const createdItem =
        await addItineraryItem({
          title:
            entryData.title,

          category:
            entryData.category,

          itineraryDate:
            entryData.itineraryDate,

          startTime:
            entryData.startTime,

          endTime:
            entryData.endTime,

          description:
            entryData.description,

          referenceUrl:
            entryData.referenceUrl,

          cost:
            entryData.amount,

          currency:
            entryData.amount > 0
              ? entryData.currency
              : null,
        })

      if (!createdItem) {
        return null
      }

      setAttractionDraft(null)
      setIsAddingActivity(false)

      if (shouldReturnToAttractions) {
        navigate(-1)
      }

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

  const handleDropActivity =
    (
      item,
      scheduleData,
    ) => {
      if (!item?.id) {
        return null
      }

      clearItineraryActionError()

      return queueItineraryScheduleUpdate(
        item.id,
        scheduleData,
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

      {isAddingActivity && (
        <TripEntryForm
          key={
            attractionDraft
              ? `attraction:${tripId}:${attractionDraft.placeId}:${attractionDraft.navigationKey}`
              : 'new-activity'
          }
          initialEntry={
            attractionDraft
              ? {
                  title:
                    attractionDraft.name,
                  category:
                    'Activities',
                  description:
                    attractionDraft.description,
                  referenceUrl:
                    attractionDraft.website,
                  amount: '',
                  itineraryDate: null,
                  startTime: null,
                  endTime: null,
                }
              : null
          }
          initialEntryType={
            attractionDraft
              ? 'plan-later'
              : undefined
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
          defaultCurrency={
            trip.budgetCurrency ??
            'ILS'
          }
          allowOnlyExpense={
            false
          }
          isSubmitting={
            isCreatingItineraryItem
          }
          externalError={
            itineraryActionError
          }
          onSubmit={
            handleAddActivity
          }
          onCancel={
            handleCancelActivityForm
          }
        />
      )}

      {isEditingActivity && (
        <ItineraryItemForm
          key={
            editingItem.id
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
            isUpdatingItineraryItem
          }
          externalError={
            itineraryActionError
          }
          onSubmit={
            handleUpdateActivity
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
          onScheduleItemDrop={
            handleDropActivity
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