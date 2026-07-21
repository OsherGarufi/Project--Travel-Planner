import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CountryDetails from '../components/CountryDetails'
import DestinationForm from '../components/plan-trip/DestinationForm'
import HistoricalWeather from '../components/plan-trip/HistoricalWeather'
import WeatherForecast from '../components/plan-trip/WeatherForecast'
import useDestinationSelection from '../hooks/plan-trip/useDestinationSelection'
import {
  getHistoricalWeather,
  getWeatherForecast,
  WEATHER_ATTRIBUTION,
  WEATHER_FORECAST_DAYS,
} from '../services/weatherService'

function formatDateForInput(date) {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

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

  const [
    weatherForecast,
    setWeatherForecast,
  ] = useState(null)

  const [
    isLoadingWeather,
    setIsLoadingWeather,
  ] = useState(false)

  const [
    weatherError,
    setWeatherError,
  ] = useState('')

  const [
    isForecastUnavailable,
    setIsForecastUnavailable,
  ] = useState(false)

  const [
    isPartialForecast,
    setIsPartialForecast,
  ] = useState(false)

  const [
    historicalWeather,
    setHistoricalWeather,
  ] = useState(null)

  const [
    isLoadingHistoricalWeather,
    setIsLoadingHistoricalWeather,
  ] = useState(false)

  const [
    historicalWeatherError,
    setHistoricalWeatherError,
  ] = useState('')

  const weatherControllerRef = useRef(null)

  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      weatherControllerRef.current?.abort()
    }
  }, [])

  const cancelActiveWeatherRequest = () => {
    if (!weatherControllerRef.current) {
      return
    }

    weatherControllerRef.current.abort()
    weatherControllerRef.current = null
  }

  const resetWeather = () => {
    cancelActiveWeatherRequest()

    setWeatherForecast(null)
    setWeatherError('')
    setIsLoadingWeather(false)
    setIsForecastUnavailable(false)
    setIsPartialForecast(false)

    setHistoricalWeather(null)
    setHistoricalWeatherError('')
    setIsLoadingHistoricalWeather(false)
  }

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

  const handleCheckDestination = async () => {
    if (
      !selectedCity ||
      !startDate ||
      !endDate
    ) {
      return
    }

    resetWeather()

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const lastForecastDate = new Date(today)

    lastForecastDate.setDate(
      lastForecastDate.getDate() +
        WEATHER_FORECAST_DAYS -
        1,
    )

    const todayValue = formatDateForInput(today)

    const lastForecastDateValue =
      formatDateForInput(lastForecastDate)

    const tripIsEntirelyOutsideForecast =
      startDate > lastForecastDateValue ||
      endDate < todayValue

    if (tripIsEntirelyOutsideForecast) {
      setIsForecastUnavailable(true)

      return
    }

    const controller = new AbortController()

    weatherControllerRef.current = controller

    try {
      setIsLoadingWeather(true)

      const forecastResult =
        await getWeatherForecast(
          selectedCity.latitude,
          selectedCity.longitude,
          controller.signal,
        )

      if (
        controller.signal.aborted ||
        weatherControllerRef.current !== controller
      ) {
        return
      }

      const availableTripDays =
        forecastResult.days.filter(
          (day) =>
            day.date >= startDate &&
            day.date <= endDate,
        )

      if (availableTripDays.length === 0) {
        setIsForecastUnavailable(true)

        return
      }

      const firstAvailableDate =
        forecastResult.days[0]?.date

      const lastAvailableDate =
        forecastResult.days[
          forecastResult.days.length - 1
        ]?.date

      const forecastIsPartial =
        startDate < firstAvailableDate ||
        endDate > lastAvailableDate

      setWeatherForecast({
        ...forecastResult,
        days: availableTripDays,
      })

      setIsPartialForecast(forecastIsPartial)
    } catch (error) {
      if (
        error.name === 'AbortError' ||
        controller.signal.aborted
      ) {
        return
      }

      console.error(
        'Failed to load weather forecast:',
        error,
      )

      setWeatherError(
        'Could not load the weather forecast. Please try again.',
      )
    } finally {
      if (
        weatherControllerRef.current === controller
      ) {
        weatherControllerRef.current = null
        setIsLoadingWeather(false)
      }
    }
  }

  const handleViewLastYearWeather = async () => {
    if (
      !selectedCity ||
      !startDate ||
      !endDate
    ) {
      return
    }

    cancelActiveWeatherRequest()

    setHistoricalWeather(null)
    setHistoricalWeatherError('')

    const controller = new AbortController()

    weatherControllerRef.current = controller

    try {
      setIsLoadingHistoricalWeather(true)

      const historicalResult =
        await getHistoricalWeather(
          selectedCity.latitude,
          selectedCity.longitude,
          startDate,
          endDate,
          controller.signal,
        )

      if (
        controller.signal.aborted ||
        weatherControllerRef.current !== controller
      ) {
        return
      }

      setHistoricalWeather(historicalResult)
    } catch (error) {
      if (
        error.name === 'AbortError' ||
        controller.signal.aborted
      ) {
        return
      }

      console.error(
        'Failed to load historical weather:',
        error,
      )

      setHistoricalWeatherError(
        'Could not load last year’s weather. Please try again.',
      )
    } finally {
      if (
        weatherControllerRef.current === controller
      ) {
        weatherControllerRef.current = null
        setIsLoadingHistoricalWeather(false)
      }
    }
  }

  return (
    <main>
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

      {weatherError && <p>{weatherError}</p>}

      {isForecastUnavailable && (
        <section>
          <h2>Weather Forecast</h2>

          <p>
            A weather forecast is not available for these
            dates yet.
          </p>

          <p>
            Forecast information becomes available within
            {` ${WEATHER_FORECAST_DAYS} days of the trip.`}
          </p>

          <p>
            Would you like to view the weather from the
            same dates last year?
          </p>

          <button
            type="button"
            onClick={handleViewLastYearWeather}
            disabled={isLoadingHistoricalWeather}
          >
            {isLoadingHistoricalWeather
              ? 'Loading Last Year’s Weather...'
              : 'View Last Year’s Weather'}
          </button>

          {historicalWeatherError && (
            <p>{historicalWeatherError}</p>
          )}
        </section>
      )}

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