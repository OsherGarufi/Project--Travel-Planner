import {
    WEATHER_ATTRIBUTION,
} from './weatherConstants'

function getRequiredDailyArray(
  daily,
  propertyName,
  expectedLength,
) {
  const propertyValue = daily[propertyName]

  if (
    !Array.isArray(propertyValue) ||
    propertyValue.length !== expectedLength
  ) {
    throw new Error(
      `Weather data is missing ${propertyName}.`,
    )
  }

  return propertyValue
}

function normalizeNullableNumber(
  value,
  propertyName,
) {
  if (value === null) {
    return null
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `Weather data contains an invalid ${propertyName}.`,
    )
  }

  return value
}

function normalizeNullableString(
  value,
  propertyName,
) {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new Error(
      `Weather data contains an invalid ${propertyName}.`,
    )
  }

  return value
}

export function mapWeatherResponse(
  response,
  dataType,
) {
  const daily = response.daily

  if (
    daily === null ||
    typeof daily !== 'object' ||
    Array.isArray(daily)
  ) {
    throw new Error(
      'The weather service did not return daily data.',
    )
  }

  const dates = daily.time

  if (!Array.isArray(dates)) {
    throw new Error(
      'The weather service did not return valid dates.',
    )
  }

  const numberOfDays = dates.length

  const weatherCodes =
    getRequiredDailyArray(
      daily,
      'weather_code',
      numberOfDays,
    )

  const maximumTemperatures =
    getRequiredDailyArray(
      daily,
      'temperature_2m_max',
      numberOfDays,
    )

  const minimumTemperatures =
    getRequiredDailyArray(
      daily,
      'temperature_2m_min',
      numberOfDays,
    )

  const maximumApparentTemperatures =
    getRequiredDailyArray(
      daily,
      'apparent_temperature_max',
      numberOfDays,
    )

  const minimumApparentTemperatures =
    getRequiredDailyArray(
      daily,
      'apparent_temperature_min',
      numberOfDays,
    )

  const precipitationSums =
    getRequiredDailyArray(
      daily,
      'precipitation_sum',
      numberOfDays,
    )

  const maximumWindSpeeds =
    getRequiredDailyArray(
      daily,
      'wind_speed_10m_max',
      numberOfDays,
    )

  const sunrises =
    getRequiredDailyArray(
      daily,
      'sunrise',
      numberOfDays,
    )

  const sunsets =
    getRequiredDailyArray(
      daily,
      'sunset',
      numberOfDays,
    )

  const precipitationProbabilities =
    dataType === 'forecast'
      ? getRequiredDailyArray(
          daily,
          'precipitation_probability_max',
          numberOfDays,
        )
      : new Array(numberOfDays).fill(null)

  const days = dates.map((date, index) => ({
    date: normalizeNullableString(
      date,
      'date',
    ),
    weatherCode: normalizeNullableNumber(
      weatherCodes[index],
      'weather code',
    ),
    maximumTemperature:
      normalizeNullableNumber(
        maximumTemperatures[index],
        'maximum temperature',
      ),
    minimumTemperature:
      normalizeNullableNumber(
        minimumTemperatures[index],
        'minimum temperature',
      ),
    maximumApparentTemperature:
      normalizeNullableNumber(
        maximumApparentTemperatures[index],
        'maximum apparent temperature',
      ),
    minimumApparentTemperature:
      normalizeNullableNumber(
        minimumApparentTemperatures[index],
        'minimum apparent temperature',
      ),
    precipitationSum:
      normalizeNullableNumber(
        precipitationSums[index],
        'precipitation sum',
      ),
    precipitationProbability:
      normalizeNullableNumber(
        precipitationProbabilities[index],
        'precipitation probability',
      ),
    maximumWindSpeed:
      normalizeNullableNumber(
        maximumWindSpeeds[index],
        'maximum wind speed',
      ),
    sunrise: normalizeNullableString(
      sunrises[index],
      'sunrise',
    ),
    sunset: normalizeNullableString(
      sunsets[index],
      'sunset',
    ),
  }))

  return {
    dataType,
    source: 'Open-Meteo',
    attribution: WEATHER_ATTRIBUTION,
    latitude: response.latitude,
    longitude: response.longitude,
    elevation: response.elevation,
    timezone: response.timezone,
    timezoneAbbreviation:
      response.timezone_abbreviation,
    fetchedAt: new Date().toISOString(),
    units: {
      temperature:
        response.daily_units
          ?.temperature_2m_max ?? '°C',
      precipitation:
        response.daily_units
          ?.precipitation_sum ?? 'mm',
      precipitationProbability:
        dataType === 'forecast'
          ? response.daily_units
              ?.precipitation_probability_max ?? '%'
          : null,
      windSpeed:
        response.daily_units
          ?.wind_speed_10m_max ?? 'km/h',
    },
    days,
  }
}