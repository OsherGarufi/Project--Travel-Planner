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
import TripNotesEditForm from '../components/trip-details/TripNotesEditForm'
import TripSummary from '../components/trip-details/TripSummary'
import TripExpensesSection from '../components/trip-expenses/TripExpensesSection'
import '../css/pages/trip-details-page.css'
import useTripWeather from '../hooks/plan-trip/useTripWeather'
import { useTripDelete } from '../hooks/trip-details/useTripDelete'
import { useTripDetails } from '../hooks/trip-details/useTripDetails'
import { useTripEdit } from '../hooks/trip-details/useTripEdit'
import { useTripNotesEdit } from '../hooks/trip-details/useTripNotesEdit'
import { searchCities } from '../services/city/cityService'
import { getCountries } from '../services/countryService'
import {
  WEATHER_ATTRIBUTION,
  WEATHER_FORECAST_DAYS,
} from '../services/weather/weatherService'
import { getPreferredLocalCurrency } from '../utils/currencyUtils'

const FOCUS_MODE = {
  TRIP: 'trip',
  NOTES: 'notes',
  EXPENSE: 'expense',
}

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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
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

  const focusFormRef =
    useRef(null)

  const [
    activeFocusMode,
    setActiveFocusMode,
  ] = useState(null)

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
    hasChanges,
    hasDateChanges,

    title,
    startDate,
    endDate,
    startDateMinimum,
    endDateMinimum,

    budgetAmount,
    budgetCurrency,

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
  } = useTripEdit({
    trip,
    replaceTrip,
  })

  const {
    notes,
    hasNotesChanges,
    isSavingNotes,
    notesSaveError,

    startNotesEditing,
    cancelNotesEditing,
    saveNotes,
    handleNotesChange,
  } = useTripNotesEdit({
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
    selectedCity:
      editWeatherCity,
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
      .then(
        (countriesResult) => {
          if (isActive) {
            setCountries(
              countriesResult,
            )
          }
        },
      )
      .catch(() => {
        // Trip details can still
        // be shown without country metadata.
      })

    return () => {
      isActive = false
    }
  }, [])

  const destinationCountry =
    useMemo(() => {
      const countryCode =
        trip
          ?.destinationCountryCode
          ?.toUpperCase()

      if (!countryCode) {
        return null
      }

      return (
        countries.find(
          (item) =>
            item.code
              ?.toUpperCase() ===
            countryCode,
        ) ?? null
      )
    }, [
      countries,
      trip?.destinationCountryCode,
    ])

  const flagUrl =
    destinationCountry?.flagUrl ??
    ''

  const localCurrency =
    getPreferredLocalCurrency(
      destinationCountry?.currencies,
    )

  useEffect(() => {
    if (
      activeFocusMode !==
        FOCUS_MODE.TRIP &&
      activeFocusMode !==
        FOCUS_MODE.NOTES
    ) {
      return
    }

    focusFormRef.current
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
  }, [activeFocusMode])

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

    setActiveFocusMode(
      FOCUS_MODE.TRIP,
    )
  }

  const handleCancelEditing = () => {
    clearEditWeather()
    cancelEditing()

    setActiveFocusMode(null)
  }

  const handleSaveEditing =
    async () => {
      const wasSaved =
        await saveTrip()

      if (!wasSaved) {
        return
      }

      clearEditWeather()

      setActiveFocusMode(null)
    }

  const handleStartNotesEditing =
    () => {
      resetDelete()
      clearEditWeather()
      startNotesEditing()

      setActiveFocusMode(
        FOCUS_MODE.NOTES,
      )
    }

  const handleCancelNotesEditing =
    () => {
      cancelNotesEditing()

      setActiveFocusMode(null)
    }

  const handleSaveNotesEditing =
    async () => {
      const wasSaved =
        await saveNotes()

      if (!wasSaved) {
        return
      }

      setActiveFocusMode(null)
    }

  const handleStartExpenseFocus =
    () => {
      resetDelete()
      clearEditWeather()

      setActiveFocusMode(
        FOCUS_MODE.EXPENSE,
      )
    }

  const handleEndExpenseFocus =
    () => {
      setActiveFocusMode(null)
    }

  const handleOpenItinerary = () => {
    if (!trip?.id || isDeleting) {
      return
    }

    navigate(
      `/trips/${trip.id}/itinerary`,
    )
  }

  const handleEditStartDateChange =
    (event) => {
      clearEditWeather()

      handleStartDateChange(event)
    }

  const handleEditEndDateChange =
    (event) => {
      clearEditWeather()

      handleEndDateChange(event)
    }

  const handleCloseEditedWeather =
    () => {
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
        setIsResolvingWeatherCity(
          true,
        )

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
          setIsEditWeatherOpen(
            false,
          )

          setWeatherLookupError(
            'Could not locate this city for the weather forecast.',
          )

          return
        }

        setEditWeatherCity(
          matchedCity,
        )

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
        setIsResolvingWeatherCity(
          false,
        )
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
        forecast={
          weatherForecast
        }
        isPartial={
          isPartialForecast
        }
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
          onClick={() =>
            navigate('/trips')
          }
        >
          <span
            className="trip-details-page__back-icon"
            aria-hidden="true"
          >
            <ArrowLeftIcon />
          </span>

          <span>
            Back to My Trips
          </span>
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
          onClick={() =>
            navigate('/trips')
          }
        >
          <span
            className="trip-details-page__back-icon"
            aria-hidden="true"
          >
            <ArrowLeftIcon />
          </span>

          <span>
            Back to My Trips
          </span>
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

  const isRegularContentHidden =
    Boolean(activeFocusMode)

  const isExpensesHidden =
    Boolean(
      activeFocusMode &&
      activeFocusMode !==
        FOCUS_MODE.EXPENSE,
    )

  return (
    <div className="trip-details-page">
      <div
        className="trip-details-page__normal-content"
        hidden={
          isRegularContentHidden
        }
      >
        <div className="trip-details-page__topbar">
          <button
            className="trip-details-page__back"
            type="button"
            onClick={() =>
              navigate('/trips')
            }
            disabled={isDeleting}
          >
            <span
              className="trip-details-page__back-icon"
              aria-hidden="true"
            >
              <ArrowLeftIcon />
            </span>

            <span>
              Back to My Trips
            </span>
          </button>

          <button
            className="trip-details-page__itinerary"
            type="button"
            onClick={
              handleOpenItinerary
            }
            disabled={isDeleting}
          >
            <span
              className="trip-details-page__itinerary-icon"
              aria-hidden="true"
            >
              <CalendarIcon />
            </span>

            <span>
              Open itinerary
            </span>
          </button>
        </div>

        <TripSummary
          trip={trip}
          flagUrl={flagUrl}
          localCurrency={
            localCurrency
          }
          onEditTrip={
            handleStartEditing
          }
          onEditNotes={
            handleStartNotesEditing
          }
          isTripEditDisabled={
            isDeleting
          }
          isNotesEditDisabled={
            isDeleting
          }
        />
      </div>

      <TripExpensesSection
        trip={trip}
        isFocusMode={
          activeFocusMode ===
          FOCUS_MODE.EXPENSE
        }
        isHidden={
          isExpensesHidden
        }
        onFocusStart={
          handleStartExpenseFocus
        }
        onFocusEnd={
          handleEndExpenseFocus
        }
      />

      <div
        className="trip-details-page__normal-content"
        hidden={
          isRegularContentHidden
        }
      >
        <DeleteTripSection
          isConfirmingDelete={
            isConfirmingDelete
          }
          isDeleting={
            isDeleting
          }
          deleteError={
            deleteError
          }
          onStartDelete={
            startDelete
          }
          onCancelDelete={
            cancelDelete
          }
          onConfirmDelete={
            confirmDelete
          }
        />
      </div>

      {activeFocusMode ===
        FOCUS_MODE.TRIP && (
        <div ref={focusFormRef}>
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
            budgetAmount={
              budgetAmount
            }
            budgetCurrency={
              budgetCurrency
            }
            localCurrency={
              localCurrency
            }
            hasChanges={
              hasChanges
            }
            hasDateChanges={
              hasDateChanges
            }
            isSaving={
              isSaving
            }
            saveError={
              saveError
            }
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
            onCheckWeather={
              handleCheckEditedWeather
            }
            onCloseWeather={
              handleCloseEditedWeather
            }
            onSave={
              handleSaveEditing
            }
            onCancel={
              handleCancelEditing
            }
          />
        </div>
      )}

      {activeFocusMode ===
        FOCUS_MODE.NOTES && (
        <div ref={focusFormRef}>
          <TripNotesEditForm
            notes={notes}
            hasChanges={
              hasNotesChanges
            }
            isSaving={
              isSavingNotes
            }
            saveError={
              notesSaveError
            }
            onNotesChange={
              handleNotesChange
            }
            onSave={
              handleSaveNotesEditing
            }
            onCancel={
              handleCancelNotesEditing
            }
          />
        </div>
      )}
    </div>
  )
}

export default TripDetailsPage