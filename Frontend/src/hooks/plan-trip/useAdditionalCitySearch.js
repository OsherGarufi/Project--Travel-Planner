import { useEffect, useRef, useState } from 'react'
import {
    MIN_CITY_SEARCH_QUERY_LENGTH,
} from '../../services/city/cityConstants'
import {
    searchCities,
} from '../../services/city/cityService'

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

function useAdditionalCitySearch(
  selectedCountryCode,
) {
  const [citySearchState, setCitySearchState] =
    useState(createInitialCitySearchState)

  const citySearchControllerRef = useRef(null)

  useEffect(() => {
    return () => {
      citySearchControllerRef.current?.abort()
    }
  }, [])

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

      if (
        normalizedQuery.length <
        MIN_CITY_SEARCH_QUERY_LENGTH
      ) {
        setCitySearchState(
          (currentState) => ({
            ...currentState,
            results: [],
            status: 'idle',
            error:
              `Enter at least ` +
              `${MIN_CITY_SEARCH_QUERY_LENGTH} ` +
              `characters to search.`,
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

  return {
    isAdditionalCitySearchOpen:
      citySearchState.isOpen,
    citySearchQuery: citySearchState.query,
    citySearchResults: citySearchState.results,
    citySearchError: citySearchState.error,
    hasSearchedAdditionalCities:
      citySearchState.hasSearched,
    isSearchingAdditionalCities:
      citySearchState.status === 'loading',

    resetAdditionalCitySearch,
    handleAdditionalCitySearchToggle,
    handleCitySearchQueryChange,
    handleAdditionalCitySearchSubmit,
    handleAdditionalCitySearchKeyDown,
  }
}

export default useAdditionalCitySearch