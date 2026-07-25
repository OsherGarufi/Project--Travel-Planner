import { moveDateOneYearBack } from '../../utils/dateUtils'
import {
    createForecastEndpoint,
    createHistoricalEndpoint,
    requestWeatherData,
    throwIfAborted,
} from './weatherApi'
import {
    getCachedForecastWeather,
    getCachedHistoricalWeather,
    saveForecastWeatherToCache,
    saveHistoricalWeatherToCache,
} from './weatherCache'
import {
    WEATHER_ATTRIBUTION,
    WEATHER_FORECAST_DAYS,
} from './weatherConstants'
import { mapWeatherResponse } from './weatherMapper'
import {
    normalizeCoordinates,
    normalizeDateRange,
} from './weatherValidation'

export {
    WEATHER_ATTRIBUTION,
    WEATHER_FORECAST_DAYS
}

export async function getWeatherForecast(
  latitude,
  longitude,
  signal = null,
) {
  throwIfAborted(signal)

  const normalizedCoordinates =
    normalizeCoordinates(latitude, longitude)

  const cachedWeather =
    getCachedForecastWeather(
      normalizedCoordinates.latitude,
      normalizedCoordinates.longitude,
    )

  if (cachedWeather) {
    return cachedWeather
  }

  const endpoint = createForecastEndpoint(
    normalizedCoordinates.latitude,
    normalizedCoordinates.longitude,
  )

  const response = await requestWeatherData(
    endpoint,
    signal,
  )

  const weatherData = mapWeatherResponse(
    response,
    'forecast',
  )

  saveForecastWeatherToCache(
    normalizedCoordinates.latitude,
    normalizedCoordinates.longitude,
    weatherData,
  )

  return weatherData
}

export async function getHistoricalWeather(
  latitude,
  longitude,
  tripStartDate,
  tripEndDate,
  signal = null,
) {
  throwIfAborted(signal)

  const normalizedCoordinates =
    normalizeCoordinates(latitude, longitude)

  const normalizedTripDates =
    normalizeDateRange(
      tripStartDate,
      tripEndDate,
    )

  const historicalStartDate =
    moveDateOneYearBack(
      normalizedTripDates.startDate,
    )

  const historicalEndDate =
    moveDateOneYearBack(
      normalizedTripDates.endDate,
    )

  const cachedWeather =
    getCachedHistoricalWeather(
      normalizedCoordinates.latitude,
      normalizedCoordinates.longitude,
      historicalStartDate,
      historicalEndDate,
    )

  if (cachedWeather) {
    return cachedWeather
  }

  const endpoint = createHistoricalEndpoint(
    normalizedCoordinates.latitude,
    normalizedCoordinates.longitude,
    historicalStartDate,
    historicalEndDate,
  )

  const response = await requestWeatherData(
    endpoint,
    signal,
  )

  const mappedWeatherData =
    mapWeatherResponse(
      response,
      'historical',
    )

  const weatherData = {
    ...mappedWeatherData,
    tripStartDate:
      normalizedTripDates.startDate,
    tripEndDate:
      normalizedTripDates.endDate,
    historicalStartDate,
    historicalEndDate,
  }

  saveHistoricalWeatherToCache(
    normalizedCoordinates.latitude,
    normalizedCoordinates.longitude,
    historicalStartDate,
    historicalEndDate,
    weatherData,
  )

  return weatherData
}