import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import ForecastUnavailable from '../components/plan-trip/ForecastUnavailable'
import HistoricalWeather from '../components/plan-trip/HistoricalWeather'
import WeatherForecast from '../components/plan-trip/WeatherForecast'
import DeleteTripSection from '../components/trip-details/DeleteTripSection'
import TripEditForm from '../components/trip-details/TripEditForm'
import TripSummary from '../components/trip-details/TripSummary'
import TripExpensesSection from '../components/trip-expenses/TripExpensesSection'
import '../css/pages/trip-details-page.css'
import useTripWeather from '../hooks/plan-trip/useTripWeather'
import { useTripDelete } from '../hooks/trip-details/useTripDelete'
import { useTripDetails } from '../hooks/trip-details/useTripDetails'
import { useTripEdit } from '../hooks/trip-details/useTripEdit'
import { searchCities } from '../services/city/cityService'
import { getCountries } from '../services/countryService'
import {
  WEATHER_ATTRIBUTION,
  WEATHER_FORECAST_DAYS,
} from '../services/weather/weatherService'
import { getPreferredLocalCurrency } from '../utils/currencyUtils'

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

  const editFormRef = useRef(null)

  const [countries, setCountries] =
    useState([])

  const [
    editWeatherCity,
    setEditWeatherCity,
  ] = useState(null)

  const [
    isResolvingWeatherCity,
    setIsResolvingWeatherCity,
  ] = useState(false)

  const [
    weatherLookupError,
    setWeatherLookupError,
  ] = useState('')

  const [
    isEditWeatherOpen,
    setIsEditWeatherOpen,
  ] = useState(false)

  const {
    trip,
    isLoadingTrip,
    tripError,
    replaceTrip,
  } = useTripDetails()

  const {
    isEditing,
    hasChanges,
    hasDateChanges,

    title,
    startDate,
    endDate,
    startDateMinimum,
    endDateMinimum,

    budgetAmount,
    budgetCurrency,
    notes,

    isSaving,
    saveError,

    startEditing,
    cancelEditing,
    saveTrip,

    handleTitleChange,
    handleStartDateChange,
    handleEndDateChange,
    handleBudgetAmountChange,
    handleBudgetCurrencyChange,
    handleNotesChange,
  } = useTripEdit({
    trip,
    replaceTrip,
  })

  const {
    weatherForecast,
    isLoadingWeather,
    weatherError,
    isForecastUnavailable,
    isPartialForecast,

    historicalWeather,
    isLoadingHistoricalWeather,
    historicalWeatherError,

    resetWeather,
    handleCheckDestination,
    handleViewLastYearWeather,
  } = useTripWeather({
    selectedCity: editWeatherCity,
    startDate,
    endDate,
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

  const destinationCountry = useMemo(() => {
    const countryCode =
      trip?.destinationCountryCode
        ?.toUpperCase()

    if (!countryCode) {
      return null
    }

    return (
      countries.find(
        (item) =>
          item.code?.toUpperCase() ===
          countryCode,
      ) ?? null
    )
  }, [
    countries,
    trip?.destinationCountryCode,
  ])

  const flagUrl =
    destinationCountry?.flagUrl ?? ''

  const localCurrency =
    getPreferredLocalCurrency(
      destinationCountry?.currencies,
    )

  useEffect(() => {
    if (!isEditing) {
      return
    }

    editFormRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [isEditing])

  const clearEditWeather = () => {
    resetWeather()
    setEditWeatherCity(null)
    setWeatherLookupError('')
    setIsEditWeatherOpen(false)
  }

  const handleStartEditing = () => {
    resetDelete()
    clearEditWeather()
    startEditing()
  }

  const handleCancelEditing = () => {
    clearEditWeather()
    cancelEditing()
  }

  const handleEditStartDateChange = (
    event,
  ) => {
    clearEditWeather()
    handleStartDateChange(event)
  }

  const handleEditEndDateChange = (
    event,
  ) => {
    clearEditWeather()
    handleEndDateChange(event)
  }

  const handleCloseEditedWeather = () => {
    clearEditWeather()
  }

  const handleCheckEditedWeather =
    async () => {
      if (
        !trip?.destinationCountryCode ||
        !trip?.destinationCity ||
        !startDate ||
        !endDate ||
        isResolvingWeatherCity
      ) {
        return
      }

      try {
        setIsResolvingWeatherCity(true)
        setWeatherLookupError('')
        resetWeather()

        const cityResults =
          await searchCities(
            trip.destinationCountryCode,
            trip.destinationCity,
          )

        const normalizedCityName =
          trip.destinationCity
            .trim()
            .toLowerCase()

        const matchedCity =
          cityResults.find(
            (city) =>
              city.name
                ?.trim()
                .toLowerCase() ===
              normalizedCityName,
          )

        if (!matchedCity) {
          setIsEditWeatherOpen(false)

          setWeatherLookupError(
            'Could not locate this city for the weather forecast.',
          )

          return
        }

        setEditWeatherCity(matchedCity)
        setIsEditWeatherOpen(true)

        await handleCheckDestination(
          matchedCity,
        )
      } catch (error) {
        console.error(
          'Failed to resolve city for weather:',
          error,
        )

        setIsEditWeatherOpen(false)

        setWeatherLookupError(
          'Could not load the weather forecast. Please try again.',
        )
      } finally {
        setIsResolvingWeatherCity(false)
      }
    }

  const editWeatherContent = (
    <>
      {weatherError && (
        <p
          className="trip-details-page__error"
          role="alert"
        >
          {weatherError}
        </p>
      )}

      <ForecastUnavailable
        isUnavailable={
          isForecastUnavailable
        }
        forecastDays={
          WEATHER_FORECAST_DAYS
        }
        isLoadingHistoricalWeather={
          isLoadingHistoricalWeather
        }
        historicalWeatherError={
          historicalWeatherError
        }
        onViewLastYearWeather={
          handleViewLastYearWeather
        }
      />

      <WeatherForecast
        forecast={weatherForecast}
        isPartial={isPartialForecast}
        forecastDays={
          WEATHER_FORECAST_DAYS
        }
        attribution={
          WEATHER_ATTRIBUTION
        }
      />

      <HistoricalWeather
        historicalWeather={
          historicalWeather
        }
        attribution={
          WEATHER_ATTRIBUTION
        }
      />
    </>
  )

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
            {tripError ||
              'Trip not found.'}
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
        localCurrency={localCurrency}
      />

      {isEditing && (
        <div ref={editFormRef}>
          <TripEditForm
            title={title}
            startDate={startDate}
            endDate={endDate}
            startDateMinimum={
              startDateMinimum
            }
            endDateMinimum={
              endDateMinimum
            }
            budgetAmount={budgetAmount}
            budgetCurrency={budgetCurrency}
            localCurrency={localCurrency}
            notes={notes}
            hasChanges={hasChanges}
            hasDateChanges={hasDateChanges}
            isSaving={isSaving}
            saveError={saveError}
            isCheckingWeather={
              isResolvingWeatherCity ||
              isLoadingWeather
            }
            weatherLookupError={
              weatherLookupError
            }
            isWeatherOpen={
              isEditWeatherOpen
            }
            weatherContent={
              editWeatherContent
            }
            onTitleChange={
              handleTitleChange
            }
            onStartDateChange={
              handleEditStartDateChange
            }
            onEndDateChange={
              handleEditEndDateChange
            }
            onBudgetAmountChange={
              handleBudgetAmountChange
            }
            onBudgetCurrencyChange={
              handleBudgetCurrencyChange
            }
            onNotesChange={
              handleNotesChange
            }
            onCheckWeather={
              handleCheckEditedWeather
            }
            onCloseWeather={
              handleCloseEditedWeather
            }
            onSave={saveTrip}
            onCancel={handleCancelEditing}
          />
        </div>
      )}

      <TripExpensesSection
        trip={trip}
      />

      {!isEditing && (
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