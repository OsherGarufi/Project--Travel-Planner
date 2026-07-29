import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CountryDetails from '../components/CountryDetails'
import CreateTripSection from '../components/plan-trip/CreateTripSection'
import DestinationForm from '../components/plan-trip/DestinationForm'
import ForecastUnavailable from '../components/plan-trip/ForecastUnavailable'
import HistoricalWeather from '../components/plan-trip/HistoricalWeather'
import WeatherForecast from '../components/plan-trip/WeatherForecast'
import useDestinationSelection from '../hooks/plan-trip/useDestinationSelection'
import useTripWeather from '../hooks/plan-trip/useTripWeather'
import { useAuth } from '../hooks/useAuth'
import { useTrips } from '../hooks/useTrips'
import { createTrip } from '../services/tripService'
import {
  WEATHER_ATTRIBUTION,
  WEATHER_FORECAST_DAYS,
} from '../services/weather/weatherService'

function PlanTripPage() {
  const { idToken } = useAuth()
  const { addTripToCache } = useTrips()
  const navigate = useNavigate()

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

  const [isCreatingTrip, setIsCreatingTrip] =
    useState(false)

  const [createTripError, setCreateTripError] =
    useState('')

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

  const clearCreateTripError = () => {
    setCreateTripError('')
  }

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

    if (endDate && newStartDate > endDate) {
      setEndDate('')
    }

    resetWeather()
  }

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value)
    clearCreateTripError()
    resetWeather()
  }

  const isCreateTripDisabled =
    !selectedCountry ||
    !selectedCity ||
    !startDate ||
    !endDate ||
    !idToken ||
    isCreatingTrip

  const handleCreateTrip = async () => {
    if (isCreateTripDisabled) {
      return
    }

    setIsCreatingTrip(true)
    setCreateTripError('')

    const tripData = {
      title: `Trip to ${selectedCity.name}`,
      destinationCountryCode:
        selectedCountry.code,
      destinationCountryName:
        selectedCountry.name,
      destinationCity: selectedCity.name,
      startDate,
      endDate,
      budgetAmount: null,
      budgetCurrency: 'ILS',
      notes: null,
    }

    try {
      const createdTrip = await createTrip(
        tripData,
        idToken,
      )

      addTripToCache(createdTrip)

      navigate(`/trips/${createdTrip.id}`)
    } catch (error) {
      console.error(
        'Failed to create trip:',
        error,
      )

      setCreateTripError(
        'Could not create the trip. Please try again.',
      )
    } finally {
      setIsCreatingTrip(false)
    }
  }

  return (
    <main className="plan-trip-page">
      <button
        type="button"
        onClick={() => navigate('/home')}
      >
        Back to Dashboard
      </button>

      <h1>Plan a New Trip</h1>

      <p>
        Choose a destination and travel dates. You can also
        check the weather before creating your trip.
      </p>

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
        onCheckDestination={handleCheckDestination}
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

      <CountryDetails country={selectedCountry} />

      {weatherError && (
        <p className="plan-trip-page__error">
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

      <CreateTripSection
        countryName={selectedCountry?.name ?? ''}
        cityName={selectedCity?.name ?? ''}
        startDate={startDate}
        endDate={endDate}
        isCreatingTrip={isCreatingTrip}
        isCreateDisabled={isCreateTripDisabled}
        createTripError={createTripError}
        onCreateTrip={handleCreateTrip}
      />
    </main>
  )
}

export default PlanTripPage