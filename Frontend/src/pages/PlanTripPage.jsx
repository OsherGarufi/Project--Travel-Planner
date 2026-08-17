import {
  useRef,
  useState,
} from 'react'
import CountryDetails from '../components/CountryDetails'
import CreateTripSection from '../components/plan-trip/CreateTripSection'
import DestinationForm from '../components/plan-trip/DestinationForm'
import ForecastUnavailable from '../components/plan-trip/ForecastUnavailable'
import HistoricalWeather from '../components/plan-trip/HistoricalWeather'
import WeatherForecast from '../components/plan-trip/WeatherForecast'
import { useCreateTrip } from '../hooks/plan-trip/useCreateTrip'
import useDestinationSelection from '../hooks/plan-trip/useDestinationSelection'
import useTripWeather from '../hooks/plan-trip/useTripWeather'
import {
  WEATHER_ATTRIBUTION,
  WEATHER_FORECAST_DAYS,
} from '../services/weather/weatherService'
import '../css/pages/plan-trip-page.css'

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

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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

  const handleAdditionalCitySelection = (city) => {
    resetWeather()
    clearCreateTripError()

    handleDestinationAdditionalCitySelection(city)
  }

  const handleStartDateChange = (event) => {
    const newStartDate = event.target.value

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
    setEndDate(event.target.value)
    clearCreateTripError()
    resetWeather()
  }

  const handleViewWeatherForecast = () => {
    if (
      !selectedCity ||
      !startDate ||
      !endDate
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
          explore useful destination information and
          check the weather before creating your trip.
        </p>
      </header>

      <div className="plan-trip-page__content">
        <DestinationForm
          countries={countries}
          selectedCountryCode={selectedCountryCode}
          selectedCity={selectedCity}
          majorCities={majorCities}
          startDate={startDate}
          endDate={endDate}
          isLoadingCountries={isLoadingCountries}
          countriesError={countriesError}
          isLoadingCities={isLoadingCities}
          citiesError={citiesError}
          isAdditionalCitySearchOpen={
            isAdditionalCitySearchOpen
          }
          citySearchQuery={citySearchQuery}
          citySearchResults={citySearchResults}
          citySearchError={citySearchError}
          hasSearchedAdditionalCities={
            hasSearchedAdditionalCities
          }
          isSearchingAdditionalCities={
            isSearchingAdditionalCities
          }
          isLoadingWeather={isLoadingWeather}
          isLoadingHistoricalWeather={
            isLoadingHistoricalWeather
          }
          onCountryChange={handleCountryChange}
          onCityChange={handleCityChange}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
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
          isUnavailable={isForecastUnavailable}
          forecastDays={WEATHER_FORECAST_DAYS}
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
          forecastDays={WEATHER_FORECAST_DAYS}
          attribution={WEATHER_ATTRIBUTION}
        />

        <HistoricalWeather
          historicalWeather={historicalWeather}
          attribution={WEATHER_ATTRIBUTION}
        />

        <CountryDetails
          country={selectedCountry}
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
          isCreatingTrip={isCreatingTrip}
          isCreateDisabled={
            isCreateTripDisabled
          }
          createTripError={createTripError}
          onCreateTrip={createSelectedTrip}
        />
      </div>
    </div>
  )
}

export default PlanTripPage