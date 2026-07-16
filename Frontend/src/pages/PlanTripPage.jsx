import { useEffect, useState } from 'react'
import CountryDetails from '../components/CountryDetails'
import { getCountries } from '../services/countryService'

function PlanTripPage() {
  const [countries, setCountries] = useState([])
  const [selectedCountryCode, setSelectedCountryCode] =
    useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [isLoadingCountries, setIsLoadingCountries] =
    useState(true)
  const [countriesError, setCountriesError] = useState('')

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

  const selectedCountry = countries.find(
    (country) => country.code === selectedCountryCode,
  )

  const handleCountryChange = (event) => {
    setSelectedCountryCode(event.target.value)
    setSelectedCity('')
  }

  return (
    <main>
      <h1>Plan a New Trip</h1>

      <p>
        Choose a destination and check relevant information
        before saving your trip.
      </p>

      {countriesError && <p>{countriesError}</p>}

      <form>
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
            value={selectedCity}
            onChange={(event) =>
              setSelectedCity(event.target.value)
            }
            disabled={!selectedCountryCode}
          >
            <option value="">Select a city</option>
          </select>
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