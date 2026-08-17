import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import DeleteTripSection from '../components/trip-details/DeleteTripSection'
import TripEditForm from '../components/trip-details/TripEditForm'
import TripSummary from '../components/trip-details/TripSummary'
import '../css/pages/trip-details-page.css'
import { useTripDelete } from '../hooks/trip-details/useTripDelete'
import { useTripDetails } from '../hooks/trip-details/useTripDetails'
import { useTripEdit } from '../hooks/trip-details/useTripEdit'
import { getCountries } from '../services/countryService'

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

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m14.5 5.5 4 4M5 19l3.2-.7L18.5 8a2.1 2.1 0 0 0-3-3L5.2 15.3 5 19Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TripDetailsLoadingState() {
  return (
    <div
      className="trip-details-page__loading"
      aria-hidden="true"
    >
      <div className="trip-details-page__loading-header">
        <span className="trip-details-page__loading-line trip-details-page__loading-line--small" />
        <span className="trip-details-page__loading-line trip-details-page__loading-line--title" />
        <span className="trip-details-page__loading-line trip-details-page__loading-line--medium" />
      </div>

      <div className="trip-details-page__loading-card">
        <div className="trip-details-page__loading-card-top">
          <span className="trip-details-page__loading-flag" />
          <span className="trip-details-page__loading-badge" />
        </div>

        <span className="trip-details-page__loading-line trip-details-page__loading-line--title" />
        <span className="trip-details-page__loading-line trip-details-page__loading-line--medium" />

        <div className="trip-details-page__loading-details">
          <span className="trip-details-page__loading-block" />
          <span className="trip-details-page__loading-block" />
          <span className="trip-details-page__loading-block" />
        </div>
      </div>
    </div>
  )
}

function TripDetailsPage() {
  const navigate = useNavigate()

  const [countries, setCountries] =
    useState([])

  const {
    trip,
    isLoadingTrip,
    tripError,
    replaceTrip,
  } = useTripDetails()

  const {
    isEditing,
    title,
    budgetAmount,
    budgetCurrency,
    notes,
    isSaving,
    saveError,
    startEditing,
    cancelEditing,
    saveTrip,
    handleTitleChange,
    handleBudgetAmountChange,
    handleBudgetCurrencyChange,
    handleNotesChange,
  } = useTripEdit({
    trip,
    replaceTrip,
  })

  const {
    isConfirmingDelete,
    isDeleting,
    deleteError,
    startDelete,
    cancelDelete,
    resetDelete,
    confirmDelete,
  } = useTripDelete({
    trip,
  })

  useEffect(() => {
    let isActive = true

    getCountries()
      .then((countriesResult) => {
        if (isActive) {
          setCountries(countriesResult)
        }
      })
      .catch(() => {
        // Trip details can still be shown
        // if country metadata is unavailable.
      })

    return () => {
      isActive = false
    }
  }, [])

  const flagUrl = useMemo(() => {
    const countryCode =
      trip?.destinationCountryCode
        ?.toUpperCase()

    if (!countryCode) {
      return ''
    }

    const country = countries.find(
      (item) =>
        item.code?.toUpperCase() ===
        countryCode,
    )

    return country?.flagUrl ?? ''
  }, [
    countries,
    trip?.destinationCountryCode,
  ])

  const handleStartEditing = () => {
    resetDelete()
    startEditing()
  }

  if (isLoadingTrip) {
    return (
      <div className="trip-details-page">
        <button
          className="trip-details-page__back"
          type="button"
          onClick={() => navigate('/trips')}
        >
          <span
            className="trip-details-page__back-icon"
            aria-hidden="true"
          >
            <ArrowLeftIcon />
          </span>

          <span>Back to My Trips</span>
        </button>

        <TripDetailsLoadingState />
      </div>
    )
  }

  if (tripError || !trip) {
    return (
      <div className="trip-details-page">
        <button
          className="trip-details-page__back"
          type="button"
          onClick={() => navigate('/trips')}
        >
          <span
            className="trip-details-page__back-icon"
            aria-hidden="true"
          >
            <ArrowLeftIcon />
          </span>

          <span>Back to My Trips</span>
        </button>

        <section className="trip-details-page__error-state">
          <p className="trip-details-page__error-eyebrow">
            TRIP DETAILS
          </p>

          <h1 className="trip-details-page__error-title">
            Trip unavailable
          </h1>

          <p className="trip-details-page__error-description">
            {tripError || 'Trip not found.'}
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="trip-details-page">
      <div className="trip-details-page__topbar">
        <button
          className="trip-details-page__back"
          type="button"
          onClick={() => navigate('/trips')}
          disabled={isSaving || isDeleting}
        >
          <span
            className="trip-details-page__back-icon"
            aria-hidden="true"
          >
            <ArrowLeftIcon />
          </span>

          <span>Back to My Trips</span>
        </button>

        {!isEditing && (
          <button
            className="trip-details-page__edit-button"
            type="button"
            onClick={handleStartEditing}
            disabled={isDeleting}
          >
            <span
              className="trip-details-page__edit-icon"
              aria-hidden="true"
            >
              <EditIcon />
            </span>

            <span>Edit trip</span>
          </button>
        )}
      </div>

      <TripSummary
        trip={trip}
        flagUrl={flagUrl}
      />

      {isEditing ? (
        <TripEditForm
          title={title}
          budgetAmount={budgetAmount}
          budgetCurrency={budgetCurrency}
          notes={notes}
          isSaving={isSaving}
          saveError={saveError}
          onTitleChange={handleTitleChange}
          onBudgetAmountChange={
            handleBudgetAmountChange
          }
          onBudgetCurrencyChange={
            handleBudgetCurrencyChange
          }
          onNotesChange={handleNotesChange}
          onSave={saveTrip}
          onCancel={cancelEditing}
        />
      ) : (
        <DeleteTripSection
          isConfirmingDelete={
            isConfirmingDelete
          }
          isDeleting={isDeleting}
          deleteError={deleteError}
          onStartDelete={startDelete}
          onCancelDelete={cancelDelete}
          onConfirmDelete={confirmDelete}
        />
      )}
    </div>
  )
}

export default TripDetailsPage