export const FORECAST_API_URL =
  'https://api.open-meteo.com/v1/forecast'

export const HISTORICAL_API_URL =
  'https://archive-api.open-meteo.com/v1/archive'

export const FORECAST_CACHE_KEY_PREFIX =
  'travelPlannerWeatherForecast'

export const HISTORICAL_CACHE_KEY_PREFIX =
  'travelPlannerHistoricalWeather'

export const FORECAST_CACHE_DURATION_MS =
  3 * 60 * 60 * 1000

export const WEATHER_FORECAST_DAYS = 14

export const WEATHER_ATTRIBUTION =
  'Weather data by Open-Meteo.com'

export const FORECAST_DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
]

export const HISTORICAL_DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
]