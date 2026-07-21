import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CountryDetails from '../components/CountryDetails'
import DestinationForm from '../components/plan-trip/DestinationForm'
import ForecastUnavailable from '../components/plan-trip/ForecastUnavailable'
import HistoricalWeather from '../components/plan-trip/HistoricalWeather'
import WeatherForecast from '../components/plan-trip/WeatherForecast'
import useDestinationSelection from '../hooks/plan-trip/useDestinationSelection'
import useTripWeather from '../hooks/plan-trip/useTripWeather'
import {
  WEATHER_ATTRIBUTION,
  WEATHER_FORECAST_DAYS,
} from '../services/weatherService'

function PlanTripPage() {
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

  const navigate = useNavigate()

  const handleCountryChange = (event) => {
    resetWeather()
    handleDestinationCountryChange(event)
  }

  const handleCityChange = (event) => {
    resetWeather()
    handleDestinationCityChange(event)
  }

  const handleAdditionalCitySelection = (city) => {
    resetWeather()
    handleDestinationAdditionalCitySelection(city)
  }

  const handleStartDateChange = (event) => {
    const newStartDate = event.target.value

    setStartDate(newStartDate)

    if (endDate && newStartDate > endDate) {
      setEndDate('')
    }

    resetWeather()
  }

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value)
    resetWeather()
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
        Choose a destination and check relevant information
        before saving your trip.
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
    </main>
  )
}

export default PlanTripPage