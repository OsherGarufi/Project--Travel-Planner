import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CountryDetails from '../components/CountryDetails'
import {
  getMajorCities,
  searchCities,
} from '../services/cityService'
import { getCountries } from '../services/countryService'
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
  const [countries, setCountries] = useState([])

  const [
    selectedCountryCode,
    setSelectedCountryCode,
  ] = useState('')

  const [majorCities, setMajorCities] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)

  const [
    isAdditionalCitySearchOpen,
    setIsAdditionalCitySearchOpen,
  ] = useState(false)

  const [
    citySearchQuery,
    setCitySearchQuery,
  ] = useState('')

  const [
    citySearchResults,
    setCitySearchResults,
  ] = useState([])

  const [
    hasSearchedAdditionalCities,
    setHasSearchedAdditionalCities,
  ] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [
    isLoadingCountries,
    setIsLoadingCountries,
  ] = useState(true)

  const [
    countriesError,
    setCountriesError,
  ] = useState('')

  const [
    isLoadingCities,
    setIsLoadingCities,
  ] = useState(false)

  const [citiesError, setCitiesError] = useState('')

  const [
    isSearchingAdditionalCities,
    setIsSearchingAdditionalCities,
  ] = useState(false)

  const [
    citySearchError,
    setCitySearchError,
  ] = useState('')

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

  const citySearchControllerRef = useRef(null)
  const weatherControllerRef = useRef(null)

  const navigate = useNavigate()

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setIsLoadingCountries(true)
        setCountriesError('')

        const countriesResult =
          await getCountries()

        setCountries(countriesResult)
      } catch (error) {
        console.error(
          'Failed to load countries:',
          error,
        )

        setCountriesError(
          'Could not load the countries. Please try again.',
        )
      } finally {
        setIsLoadingCountries(false)
      }
    }

    loadCountries()
  }, [])

  useEffect(() => {
    if (!selectedCountryCode) {
      return undefined
    }

    const controller = new AbortController()

    const loadMajorCities = async () => {
      try {
        setIsLoadingCities(true)
        setCitiesError('')
        setMajorCities([])
        setSelectedCity(null)

        const citiesResult = await getMajorCities(
          selectedCountryCode,
          controller.signal,
        )

        setMajorCities(citiesResult)
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        console.error(
          'Failed to load major cities:',
          error,
        )

        setCitiesError(
          'Could not load the cities. Please try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCities(false)
        }
      }
    }

    loadMajorCities()

    return () => {
      controller.abort()
    }
  }, [selectedCountryCode])

  useEffect(() => {
    return () => {
      citySearchControllerRef.current?.abort()
      weatherControllerRef.current?.abort()
    }
  }, [])

  const selectedCountry = countries.find(
    (country) =>
      country.code === selectedCountryCode,
  )

  const isSelectedCityInMajorCities =
    selectedCity &&
    majorCities.some(
      (city) => city.id === selectedCity.id,
    )

  const cancelActiveCitySearch = () => {
    if (!citySearchControllerRef.current) {
      return
    }

    citySearchControllerRef.current.abort()
    citySearchControllerRef.current = null
  }

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

  const resetAdditionalCitySearch = () => {
    cancelActiveCitySearch()

    setCitySearchQuery('')
    setCitySearchResults([])
    setCitySearchError('')
    setHasSearchedAdditionalCities(false)
    setIsSearchingAdditionalCities(false)
  }

  const handleCountryChange = (event) => {
    setSelectedCountryCode(event.target.value)

    setSelectedCity(null)
    setMajorCities([])
    setCitiesError('')

    setIsAdditionalCitySearchOpen(false)
    resetAdditionalCitySearch()
    resetWeather()
  }

  const handleCityChange = (event) => {
    const selectedCityId = event.target.value

    resetWeather()

    if (!selectedCityId) {
      setSelectedCity(null)

      return
    }

    const city = majorCities.find(
      (majorCity) =>
        String(majorCity.id) === selectedCityId,
    )

    setSelectedCity(city ?? null)

    setIsAdditionalCitySearchOpen(false)
    resetAdditionalCitySearch()
  }

  const handleAdditionalCitySearchToggle = () => {
    if (isAdditionalCitySearchOpen) {
      setIsAdditionalCitySearchOpen(false)
      resetAdditionalCitySearch()

      return
    }

    setIsAdditionalCitySearchOpen(true)
  }

  const handleCitySearchQueryChange = (event) => {
    cancelActiveCitySearch()

    setCitySearchQuery(event.target.value)
    setCitySearchResults([])
    setCitySearchError('')
    setHasSearchedAdditionalCities(false)
    setIsSearchingAdditionalCities(false)
  }

  const handleAdditionalCitySearchSubmit =
    async () => {
      const normalizedQuery = citySearchQuery
        .trim()
        .replace(/\s+/g, ' ')

      if (!selectedCountryCode) {
        return
      }

      if (normalizedQuery.length < 2) {
        setCitySearchResults([])
        setHasSearchedAdditionalCities(false)

        setCitySearchError(
          'Enter at least 2 characters to search.',
        )

        return
      }

      cancelActiveCitySearch()

      const controller = new AbortController()

      citySearchControllerRef.current = controller

      try {
        setIsSearchingAdditionalCities(true)
        setCitySearchError('')
        setCitySearchResults([])
        setHasSearchedAdditionalCities(false)

        const citiesResult = await searchCities(
          selectedCountryCode,
          normalizedQuery,
          controller.signal,
        )

        if (
          controller.signal.aborted ||
          citySearchControllerRef.current !==
            controller
        ) {
          return
        }

        setCitySearchResults(citiesResult)
        setHasSearchedAdditionalCities(true)
      } catch (error) {
        if (
          error.name === 'AbortError' ||
          controller.signal.aborted
        ) {
          return
        }

        console.error(
          'Failed to search additional cities:',
          error,
        )

        setCitySearchResults([])
        setHasSearchedAdditionalCities(true)

        setCitySearchError(
          'Could not search for cities. Please try again.',
        )
      } finally {
        if (
          citySearchControllerRef.current ===
          controller
        ) {
          citySearchControllerRef.current = null
          setIsSearchingAdditionalCities(false)
        }
      }
    }

  const handleAdditionalCitySearchKeyDown = (
    event,
  ) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()

    handleAdditionalCitySearchSubmit()
  }

  const handleAdditionalCitySelection = (city) => {
    setSelectedCity(city)

    setIsAdditionalCitySearchOpen(false)
    resetAdditionalCitySearch()
    resetWeather()
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

      {countriesError && <p>{countriesError}</p>}

      <form
        onSubmit={(event) => event.preventDefault()}
      >
        <div>
          <label htmlFor="country">Country</label>

          <select
            id="country"
            value={selectedCountryCode}
            onChange={handleCountryChange}
            disabled={
              isLoadingCountries ||
              Boolean(countriesError)
            }
          >
            <option value="">
              {isLoadingCountries
                ? 'Loading countries...'
                : 'Select a country'}
            </option>

            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
              >
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="city">City</label>

          <select
            id="city"
            value={
              selectedCity
                ? String(selectedCity.id)
                : ''
            }
            onChange={handleCityChange}
            disabled={
              !selectedCountryCode ||
              isLoadingCities ||
              Boolean(citiesError)
            }
          >
            <option value="">
              {isLoadingCities
                ? 'Loading major cities...'
                : 'Select a city'}
            </option>

            {selectedCity &&
              !isSelectedCityInMajorCities && (
                <option value={selectedCity.id}>
                  {selectedCity.name}
                </option>
              )}

            {majorCities.map((city) => (
              <option
                key={city.id}
                value={city.id}
              >
                {city.name}
              </option>
            ))}
          </select>

          {citiesError && <p>{citiesError}</p>}

          {selectedCountryCode &&
            !isLoadingCities &&
            !citiesError && (
              <button
                type="button"
                onClick={
                  handleAdditionalCitySearchToggle
                }
              >
                {isAdditionalCitySearchOpen
                  ? 'Close city search'
                  : "Can't find your city? Search for another city"}
              </button>
            )}

          {isAdditionalCitySearchOpen && (
            <div>
              <label htmlFor="additionalCitySearch">
                Search for another city
              </label>

              <input
                id="additionalCitySearch"
                type="text"
                value={citySearchQuery}
                onChange={
                  handleCitySearchQueryChange
                }
                onKeyDown={
                  handleAdditionalCitySearchKeyDown
                }
                placeholder="Enter a city name"
                autoComplete="off"
              />

              <button
                type="button"
                onClick={
                  handleAdditionalCitySearchSubmit
                }
                disabled={
                  isSearchingAdditionalCities ||
                  citySearchQuery.trim().length < 2
                }
              >
                {isSearchingAdditionalCities
                  ? 'Searching...'
                  : 'Search'}
              </button>

              {citySearchError && (
                <p>{citySearchError}</p>
              )}

              {hasSearchedAdditionalCities &&
                !isSearchingAdditionalCities &&
                !citySearchError &&
                citySearchResults.length === 0 && (
                  <p>No matching cities were found.</p>
                )}

              {citySearchResults.length > 0 && (
                <div>
                  <p>Select a city:</p>

                  {citySearchResults.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() =>
                        handleAdditionalCitySelection(
                          city,
                        )
                      }
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="startDate">
            Start date
          </label>

          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
          />
        </div>

        <div>
          <label htmlFor="endDate">
            End date
          </label>

          <input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate}
            onChange={handleEndDateChange}
          />
        </div>

        <button
          type="button"
          onClick={handleCheckDestination}
          disabled={
            !selectedCountryCode ||
            !selectedCity ||
            !startDate ||
            !endDate ||
            isLoadingWeather ||
            isLoadingHistoricalWeather
          }
        >
          {isLoadingWeather
            ? 'Checking Destination...'
            : 'Check Destination'}
        </button>
      </form>

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

      {weatherForecast && (
        <section>
          <h2>Weather Forecast</h2>

          {isPartialForecast && (
            <p>
              Only the days currently inside the
              {` ${WEATHER_FORECAST_DAYS}-day forecast `}
              range are displayed.
            </p>
          )}

          <p>
            Timezone: {weatherForecast.timezone}
          </p>

          <ul>
            {weatherForecast.days.map((day) => (
              <li key={day.date}>
                <h3>{day.date}</h3>

                <p>
                  Temperature:{' '}
                  {day.minimumTemperature}
                  {weatherForecast.units.temperature}
                  {' – '}
                  {day.maximumTemperature}
                  {weatherForecast.units.temperature}
                </p>

                <p>
                  Feels like:{' '}
                  {day.minimumApparentTemperature}
                  {weatherForecast.units.temperature}
                  {' – '}
                  {day.maximumApparentTemperature}
                  {weatherForecast.units.temperature}
                </p>

                <p>
                  Precipitation probability:{' '}
                  {day.precipitationProbability}
                  {
                    weatherForecast.units
                      .precipitationProbability
                  }
                </p>

                <p>
                  Precipitation amount:{' '}
                  {day.precipitationSum}
                  {weatherForecast.units.precipitation}
                </p>

                <p>
                  Maximum wind speed:{' '}
                  {day.maximumWindSpeed}{' '}
                  {weatherForecast.units.windSpeed}
                </p>

                <p>Sunrise: {day.sunrise}</p>
                <p>Sunset: {day.sunset}</p>
              </li>
            ))}
          </ul>

          <p>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
            >
              {WEATHER_ATTRIBUTION}
            </a>
          </p>
        </section>
      )}

      {historicalWeather && (
        <section>
          <h2>
            Weather From the Same Dates Last Year
          </h2>

          <p>
            Historical period:{' '}
            {historicalWeather.historicalStartDate}
            {' – '}
            {historicalWeather.historicalEndDate}
          </p>

          <p>
            Historical weather is provided for reference
            only. It is not a forecast, and actual
            conditions may differ.
          </p>

          <p>
            Timezone: {historicalWeather.timezone}
          </p>

          <ul>
            {historicalWeather.days.map((day) => (
              <li key={day.date}>
                <h3>{day.date}</h3>

                <p>
                  Temperature:{' '}
                  {day.minimumTemperature}
                  {historicalWeather.units.temperature}
                  {' – '}
                  {day.maximumTemperature}
                  {historicalWeather.units.temperature}
                </p>

                <p>
                  Feels like:{' '}
                  {day.minimumApparentTemperature}
                  {historicalWeather.units.temperature}
                  {' – '}
                  {day.maximumApparentTemperature}
                  {historicalWeather.units.temperature}
                </p>

                <p>
                  Precipitation amount:{' '}
                  {day.precipitationSum}
                  {historicalWeather.units.precipitation}
                </p>

                <p>
                  Maximum wind speed:{' '}
                  {day.maximumWindSpeed}{' '}
                  {historicalWeather.units.windSpeed}
                </p>

                <p>Sunrise: {day.sunrise}</p>
                <p>Sunset: {day.sunset}</p>
              </li>
            ))}
          </ul>

          <p>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
            >
              {WEATHER_ATTRIBUTION}
            </a>
          </p>
        </section>
      )}
    </main>
  )
}

export default PlanTripPage