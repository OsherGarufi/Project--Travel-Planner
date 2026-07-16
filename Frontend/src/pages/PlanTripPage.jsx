import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CountryDetails from '../components/CountryDetails'
import {
  getMajorCities,
  searchCities,
} from '../services/cityService'
import { getCountries } from '../services/countryService'

function PlanTripPage() {
  const [countries, setCountries] = useState([])
  const [selectedCountryCode, setSelectedCountryCode] =
    useState('')

  const [majorCities, setMajorCities] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)

  const [
    isAdditionalCitySearchOpen,
    setIsAdditionalCitySearchOpen,
  ] = useState(false)

  const [citySearchQuery, setCitySearchQuery] =
    useState('')

  const [citySearchResults, setCitySearchResults] =
    useState([])

  const [
    hasSearchedAdditionalCities,
    setHasSearchedAdditionalCities,
  ] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [isLoadingCountries, setIsLoadingCountries] =
    useState(true)

  const [countriesError, setCountriesError] =
    useState('')

  const [isLoadingCities, setIsLoadingCities] =
    useState(false)

  const [citiesError, setCitiesError] = useState('')

  const [
    isSearchingAdditionalCities,
    setIsSearchingAdditionalCities,
  ] = useState(false)

  const [citySearchError, setCitySearchError] =
    useState('')

  const citySearchControllerRef = useRef(null)

  const navigate = useNavigate()

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setIsLoadingCountries(true)
        setCountriesError('')

        const countriesResult = await getCountries()

        setCountries(countriesResult)
      } catch (error) {
        console.error('Failed to load countries:', error)

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
      setMajorCities([])
      setSelectedCity(null)
      setCitiesError('')
      setIsLoadingCities(false)

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
    }
  }, [])

  const selectedCountry = countries.find(
    (country) => country.code === selectedCountryCode,
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
  }

  const handleCityChange = (event) => {
    const selectedCityId = event.target.value

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

  const handleAdditionalCitySearchSubmit = async () => {
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
        citySearchControllerRef.current !== controller
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
      if (citySearchControllerRef.current === controller) {
        citySearchControllerRef.current = null
        setIsSearchingAdditionalCities(false)
      }
    }
  }

  const handleAdditionalCitySearchKeyDown = (event) => {
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
              isLoadingCountries || Boolean(countriesError)
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
                onChange={handleCitySearchQueryChange}
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
                        handleAdditionalCitySelection(city)
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
          <label htmlFor="startDate">Start date</label>

          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="endDate">End date</label>

          <input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) =>
              setEndDate(event.target.value)
            }
          />
        </div>

        <button
          type="button"
          disabled={
            !selectedCountryCode ||
            !selectedCity ||
            !startDate ||
            !endDate
          }
        >
          Check Destination
        </button>
      </form>

      <CountryDetails country={selectedCountry} />
    </main>
  )
}

export default PlanTripPage