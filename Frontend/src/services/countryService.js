const COUNTRIES_API_URL =
  'https://restcountries.com/v3.1/all?fields=name,cca2,flags,capital,currencies,languages,population,region'

export async function getCountries() {
  const response = await fetch(COUNTRIES_API_URL)

  if (!response.ok) {
    throw new Error(
      `Countries API error: ${response.status}`,
    )
  }

  const countries = await response.json()

  return countries.sort((firstCountry, secondCountry) =>
    firstCountry.name.common.localeCompare(
      secondCountry.name.common,
    ),
  )
}