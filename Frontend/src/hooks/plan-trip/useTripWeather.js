import { useEffect, useRef, useState } from 'react'
import {
    getHistoricalWeather,
    getWeatherForecast,
    WEATHER_FORECAST_DAYS,
} from '../../services/weatherService'

const INITIAL_FORECAST_STATE = {
  status: 'idle',
  data: null,
  error: '',
  isPartial: false,
}

const INITIAL_HISTORICAL_STATE = {
  status: 'idle',
  data: null,
  error: '',
}

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

function useTripWeather({
  selectedCity,
  startDate,
  endDate,
}) {
  const [
    forecastState,
    setForecastState,
  ] = useState(INITIAL_FORECAST_STATE)

  const [
    historicalState,
    setHistoricalState,
  ] = useState(INITIAL_HISTORICAL_STATE)

  const weatherControllerRef = useRef(null)

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

    setForecastState(INITIAL_FORECAST_STATE)
    setHistoricalState(INITIAL_HISTORICAL_STATE)
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
      setForecastState({
        status: 'unavailable',
        data: null,
        error: '',
        isPartial: false,
      })

      return
    }

    const controller = new AbortController()

    weatherControllerRef.current = controller

    setForecastState({
      status: 'loading',
      data: null,
      error: '',
      isPartial: false,
    })

    try {
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
        setForecastState({
          status: 'unavailable',
          data: null,
          error: '',
          isPartial: false,
        })

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

      setForecastState({
        status: 'success',
        data: {
          ...forecastResult,
          days: availableTripDays,
        },
        error: '',
        isPartial: forecastIsPartial,
      })
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

      setForecastState({
        status: 'error',
        data: null,
        error:
          'Could not load the weather forecast. Please try again.',
        isPartial: false,
      })
    } finally {
      if (
        weatherControllerRef.current === controller
      ) {
        weatherControllerRef.current = null
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

    const controller = new AbortController()

    weatherControllerRef.current = controller

    setHistoricalState({
      status: 'loading',
      data: null,
      error: '',
    })

    try {
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

      setHistoricalState({
        status: 'success',
        data: historicalResult,
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
        'Failed to load historical weather:',
        error,
      )

      setHistoricalState({
        status: 'error',
        data: null,
        error:
          'Could not load last year’s weather. Please try again.',
      })
    } finally {
      if (
        weatherControllerRef.current === controller
      ) {
        weatherControllerRef.current = null
      }
    }
  }

  return {
    weatherForecast: forecastState.data,
    isLoadingWeather:
      forecastState.status === 'loading',
    weatherError: forecastState.error,
    isForecastUnavailable:
      forecastState.status === 'unavailable',
    isPartialForecast:
      forecastState.isPartial,

    historicalWeather: historicalState.data,
    isLoadingHistoricalWeather:
      historicalState.status === 'loading',
    historicalWeatherError:
      historicalState.error,

    resetWeather,
    handleCheckDestination,
    handleViewLastYearWeather,
  }
}

export default useTripWeather