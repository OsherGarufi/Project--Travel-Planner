import {
  useRef,
  useState,
} from 'react'
import CountryDetails from '../components/CountryDetails'
import BudgetSection from '../components/plan-trip/BudgetSection'
import CreateTripSection from '../components/plan-trip/CreateTripSection'
import DestinationForm from '../components/plan-trip/DestinationForm'
import ForecastUnavailable from '../components/plan-trip/ForecastUnavailable'
import HistoricalWeather from '../components/plan-trip/HistoricalWeather'
import WeatherForecast from '../components/plan-trip/WeatherForecast'
import '../css/pages/plan-trip-page.css'
import { useCreateTrip } from '../hooks/plan-trip/useCreateTrip'
import useDestinationSelection from '../hooks/plan-trip/useDestinationSelection'
import { useTripBudget } from '../hooks/plan-trip/useTripBudget'
import useTripWeather from '../hooks/plan-trip/useTripWeather'
import {
  WEATHER_ATTRIBUTION,
  WEATHER_FORECAST_DAYS,
} from '../services/weather/weatherService'
import { getPreferredLocalCurrency } from '../utils/currencyUtils'

function getTodayDateInputValue() {
  const today = new Date()

  const year = today.getFullYear()
  const month = String(
    today.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    today.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function PlanTripPage() {
  const weatherSectionRef = useRef(null)

  const {
    countries,
    selectedCountry,
    selectedCountryCode,
    majorCities,
    selectedCity,

    isLoadingCountries,
    countriesError,
    isLoadingCities,
    citiesError,

    isAdditionalCitySearchOpen,
    citySearchQuery,
    citySearchResults,
    citySearchError,
    hasSearchedAdditionalCities,
    isSearchingAdditionalCities,

    handleCountryChange:
      handleDestinationCountryChange,
    handleCityChange:
      handleDestinationCityChange,
    handleAdditionalCitySearchToggle,
    handleCitySearchQueryChange,
    handleAdditionalCitySearchSubmit,
    handleAdditionalCitySearchKeyDown,
    handleAdditionalCitySelection:
      handleDestinationAdditionalCitySelection,
  } = useDestinationSelection()

  const [startDate, setStartDate] =
    useState('')

  const [endDate, setEndDate] =
    useState('')

  const {
    budgetAmount,
    parsedBudgetAmount,
    budgetCurrency,
    handleBudgetAmountChange,
    handleBudgetCurrencyChange,
  } = useTripBudget()

  const minimumTravelDate =
    getTodayDateInputValue()

  const localCurrency =
    getPreferredLocalCurrency(
      selectedCountry?.currencies,
    )

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
    selectedCity,
    startDate,
    endDate,
  })

  const {
    isCreatingTrip,
    createTripError,
    isCreateTripDisabled,
    clearCreateTripError,
    createSelectedTrip,
  } = useCreateTrip({
    selectedCountry,
    selectedCity,
    startDate,
    endDate,
    budgetAmount: parsedBudgetAmount,
    budgetCurrency,
  })

  const handleCountryChange = (event) => {
    resetWeather()
    clearCreateTripError()

    handleDestinationCountryChange(event)
  }

  const handleCityChange = (event) => {
    resetWeather()
    clearCreateTripError()

    handleDestinationCityChange(event)
  }

  const handleAdditionalCitySelection = (
    city,
  ) => {
    resetWeather()
    clearCreateTripError()

    handleDestinationAdditionalCitySelection(
      city,
    )
  }

  const handleStartDateChange = (event) => {
    const newStartDate =
      event.target.value

    if (
      newStartDate &&
      newStartDate < minimumTravelDate
    ) {
      return
    }

    setStartDate(newStartDate)
    clearCreateTripError()

    if (
      endDate &&
      newStartDate > endDate
    ) {
      setEndDate('')
    }

    resetWeather()
  }

  const handleEndDateChange = (event) => {
    const newEndDate =
      event.target.value

    if (
      newEndDate &&
      (
        newEndDate < minimumTravelDate ||
        (
          startDate &&
          newEndDate < startDate
        )
      )
    ) {
      return
    }

    setEndDate(newEndDate)
    clearCreateTripError()
    resetWeather()
  }

  const handleViewWeatherForecast = () => {
    if (
      !selectedCity ||
      !startDate ||
      !endDate ||
      startDate < minimumTravelDate ||
      endDate < startDate
    ) {
      return
    }

    handleCheckDestination()

    requestAnimationFrame(() => {
      weatherSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  return (
    <div className="plan-trip-page">
      <header className="plan-trip-page__header">
        <p className="plan-trip-page__eyebrow">
          TRIP PLANNER
        </p>

        <h1 className="plan-trip-page__title">
          Plan a new trip
        </h1>

        <p className="plan-trip-page__description">
          Choose your destination and travel dates,
          explore useful destination information,
          check the weather and set your planned
          budget before creating your trip.
        </p>
      </header>

      <div className="plan-trip-page__content">
        <DestinationForm
          countries={countries}
          selectedCountryCode={
            selectedCountryCode
          }
          selectedCity={selectedCity}
          majorCities={majorCities}
          startDate={startDate}
          endDate={endDate}
          minimumTravelDate={
            minimumTravelDate
          }
          isLoadingCountries={
            isLoadingCountries
          }
          countriesError={countriesError}
          isLoadingCities={isLoadingCities}
          citiesError={citiesError}
          isAdditionalCitySearchOpen={
            isAdditionalCitySearchOpen
          }
          citySearchQuery={citySearchQuery}
          citySearchResults={
            citySearchResults
          }
          citySearchError={citySearchError}
          hasSearchedAdditionalCities={
            hasSearchedAdditionalCities
          }
          isSearchingAdditionalCities={
            isSearchingAdditionalCities
          }
          isLoadingWeather={
            isLoadingWeather
          }
          isLoadingHistoricalWeather={
            isLoadingHistoricalWeather
          }
          onCountryChange={
            handleCountryChange
          }
          onCityChange={handleCityChange}
          onStartDateChange={
            handleStartDateChange
          }
          onEndDateChange={
            handleEndDateChange
          }
          onCheckDestination={
            handleViewWeatherForecast
          }
          onAdditionalCitySearchToggle={
            handleAdditionalCitySearchToggle
          }
          onCitySearchQueryChange={
            handleCitySearchQueryChange
          }
          onAdditionalCitySearchSubmit={
            handleAdditionalCitySearchSubmit
          }
          onAdditionalCitySearchKeyDown={
            handleAdditionalCitySearchKeyDown
          }
          onAdditionalCitySelection={
            handleAdditionalCitySelection
          }
        />

        <div
          ref={weatherSectionRef}
          className="plan-trip-page__weather-anchor"
          aria-hidden="true"
        />

        {weatherError && (
          <p
            className="plan-trip-page__error"
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
          attribution={WEATHER_ATTRIBUTION}
        />

        <HistoricalWeather
          historicalWeather={
            historicalWeather
          }
          attribution={WEATHER_ATTRIBUTION}
        />

        <CountryDetails
          country={selectedCountry}
        />

        <BudgetSection
          budgetAmount={budgetAmount}
          budgetCurrency={budgetCurrency}
          localCurrency={localCurrency}
          onBudgetAmountChange={
            handleBudgetAmountChange
          }
          onBudgetCurrencyChange={
            handleBudgetCurrencyChange
          }
        />

        <CreateTripSection
          countryName={
            selectedCountry?.name ?? ''
          }
          cityName={
            selectedCity?.name ?? ''
          }
          startDate={startDate}
          endDate={endDate}
          budgetAmount={
            parsedBudgetAmount
          }
          budgetCurrency={
            budgetCurrency
          }
          isCreatingTrip={
            isCreatingTrip
          }
          isCreateDisabled={
            isCreateTripDisabled
          }
          createTripError={
            createTripError
          }
          onCreateTrip={
            createSelectedTrip
          }
        />
      </div>
    </div>
  )
}

export default PlanTripPage