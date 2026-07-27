import { useEffect, useState } from 'react'
import {
  getMajorCities,
} from '../../services/city/cityService'
import { getCountries } from '../../services/countryService'
import useAdditionalCitySearch from './useAdditionalCitySearch'

function createInitialCitiesState() {
  return {
    items: [],
    status: 'idle',
    error: '',
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

  const {
    isAdditionalCitySearchOpen,
    citySearchQuery,
    citySearchResults,
    citySearchError,
    hasSearchedAdditionalCities,
    isSearchingAdditionalCities,

    resetAdditionalCitySearch,
    handleAdditionalCitySearchToggle,
    handleCitySearchQueryChange,
    handleAdditionalCitySearchSubmit,
    handleAdditionalCitySearchKeyDown,
  } = useAdditionalCitySearch(
    selectedCountryCode,
  )

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

  const countries = countriesState.items
  const majorCities = citiesState.items

  const selectedCountry = countries.find(
    (country) =>
      country.code === selectedCountryCode,
  )

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

    isAdditionalCitySearchOpen,
    citySearchQuery,
    citySearchResults,
    citySearchError,
    hasSearchedAdditionalCities,
    isSearchingAdditionalCities,

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