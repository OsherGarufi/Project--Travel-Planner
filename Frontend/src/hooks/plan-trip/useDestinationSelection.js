import { useEffect, useRef, useState } from 'react'
import {
    getMajorCities,
    searchCities,
} from '../../services/cityService'
import { getCountries } from '../../services/countryService'

function createInitialCitiesState() {
  return {
    items: [],
    status: 'idle',
    error: '',
  }
}

function createInitialCitySearchState(
  isOpen = false,
) {
  return {
    isOpen,
    query: '',
    results: [],
    status: 'idle',
    error: '',
    hasSearched: false,
  }
}

function useDestinationSelection() {
  const [countriesState, setCountriesState] =
    useState({
      items: [],
      status: 'loading',
      error: '',
    })

  const [
    selectedCountryCode,
    setSelectedCountryCode,
  ] = useState('')

  const [citiesState, setCitiesState] = useState(
    createInitialCitiesState,
  )

  const [selectedCity, setSelectedCity] =
    useState(null)

  const [citySearchState, setCitySearchState] =
    useState(createInitialCitySearchState)

  const citySearchControllerRef = useRef(null)

  useEffect(() => {
    let isActive = true

    const loadCountries = async () => {
      try {
        const countriesResult =
          await getCountries()

        if (!isActive) {
          return
        }

        setCountriesState({
          items: countriesResult,
          status: 'success',
          error: '',
        })
      } catch (error) {
        if (!isActive) {
          return
        }

        console.error(
          'Failed to load countries:',
          error,
        )

        setCountriesState({
          items: [],
          status: 'error',
          error:
            'Could not load the countries. Please try again.',
        })
      }
    }

    loadCountries()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!selectedCountryCode) {
      return undefined
    }

    const controller = new AbortController()

    const loadMajorCities = async () => {
      try {
        const citiesResult = await getMajorCities(
          selectedCountryCode,
          controller.signal,
        )

        if (controller.signal.aborted) {
          return
        }

        setCitiesState({
          items: citiesResult,
          status: 'success',
          error: '',
        })
      } catch (error) {
        if (
          error.name === 'AbortError' ||
          controller.signal.aborted
        ) {
          return
        }

        console.error(
          'Failed to load major cities:',
          error,
        )

        setCitiesState({
          items: [],
          status: 'error',
          error:
            'Could not load the cities. Please try again.',
        })
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

  const countries = countriesState.items
  const majorCities = citiesState.items

  const selectedCountry = countries.find(
    (country) =>
      country.code === selectedCountryCode,
  )

  const cancelActiveCitySearch = () => {
    if (!citySearchControllerRef.current) {
      return
    }

    citySearchControllerRef.current.abort()
    citySearchControllerRef.current = null
  }

  const resetAdditionalCitySearch = (
    isOpen = false,
  ) => {
    cancelActiveCitySearch()

    setCitySearchState(
      createInitialCitySearchState(isOpen),
    )
  }

  const handleCountryChange = (event) => {
    const nextCountryCode = event.target.value

    setSelectedCountryCode(nextCountryCode)
    setSelectedCity(null)

    setCitiesState(
      nextCountryCode
        ? {
            items: [],
            status: 'loading',
            error: '',
          }
        : createInitialCitiesState(),
    )

    resetAdditionalCitySearch()
  }

  const handleCityChange = (event) => {
    const selectedCityId = event.target.value

    if (!selectedCityId) {
      setSelectedCity(null)
      resetAdditionalCitySearch()

      return
    }

    const city = majorCities.find(
      (majorCity) =>
        String(majorCity.id) === selectedCityId,
    )

    setSelectedCity(city ?? null)
    resetAdditionalCitySearch()
  }

  const handleAdditionalCitySearchToggle = () => {
    if (citySearchState.isOpen) {
      resetAdditionalCitySearch()

      return
    }

    resetAdditionalCitySearch(true)
  }

  const handleCitySearchQueryChange = (event) => {
    cancelActiveCitySearch()

    setCitySearchState((currentState) => ({
      ...currentState,
      query: event.target.value,
      results: [],
      status: 'idle',
      error: '',
      hasSearched: false,
    }))
  }

  const handleAdditionalCitySearchSubmit =
    async () => {
      const normalizedQuery =
        citySearchState.query
          .trim()
          .replace(/\s+/g, ' ')

      if (!selectedCountryCode) {
        return
      }

      if (normalizedQuery.length < 2) {
        setCitySearchState(
          (currentState) => ({
            ...currentState,
            results: [],
            status: 'idle',
            error:
              'Enter at least 2 characters to search.',
            hasSearched: false,
          }),
        )

        return
      }

      cancelActiveCitySearch()

      const controller = new AbortController()

      citySearchControllerRef.current = controller

      setCitySearchState(
        (currentState) => ({
          ...currentState,
          results: [],
          status: 'loading',
          error: '',
          hasSearched: false,
        }),
      )

      try {
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

        setCitySearchState(
          (currentState) => ({
            ...currentState,
            results: citiesResult,
            status: 'success',
            error: '',
            hasSearched: true,
          }),
        )
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

        setCitySearchState(
          (currentState) => ({
            ...currentState,
            results: [],
            status: 'error',
            error:
              'Could not search for cities. Please try again.',
            hasSearched: true,
          }),
        )
      } finally {
        if (
          citySearchControllerRef.current ===
          controller
        ) {
          citySearchControllerRef.current = null
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
    resetAdditionalCitySearch()
  }

  return {
    countries,
    selectedCountry,
    selectedCountryCode,
    majorCities,
    selectedCity,

    isLoadingCountries:
      countriesState.status === 'loading',
    countriesError: countriesState.error,

    isLoadingCities:
      citiesState.status === 'loading',
    citiesError: citiesState.error,

    isAdditionalCitySearchOpen:
      citySearchState.isOpen,
    citySearchQuery: citySearchState.query,
    citySearchResults: citySearchState.results,
    citySearchError: citySearchState.error,
    hasSearchedAdditionalCities:
      citySearchState.hasSearched,
    isSearchingAdditionalCities:
      citySearchState.status === 'loading',

    handleCountryChange,
    handleCityChange,
    handleAdditionalCitySearchToggle,
    handleCitySearchQueryChange,
    handleAdditionalCitySearchSubmit,
    handleAdditionalCitySearchKeyDown,
    handleAdditionalCitySelection,
  }
}

export default useDestinationSelection