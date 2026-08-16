import '../../css/components/destination-form.css'
import AdditionalCitySearch from './AdditionalCitySearch'

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 12h14M14 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DestinationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="10"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 3v4M16 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WeatherIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7.5 17.5h9a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.4 1.7A3.2 3.2 0 0 0 7.5 17.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m9 20-.8 1.5M13 20l-.8 1.5M17 20l-.8 1.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DestinationForm({
  countries,
  selectedCountryCode,
  selectedCity,
  majorCities,
  startDate,
  endDate,

  isLoadingCountries,
  countriesError,
  isLoadingCities,
  citiesError,

  isAdditionalCitySearchOpen,
  citySearchQuery,
  citySearchResults,
  citySearchError,
  hasSearchedAdditionalCities,
  isSearchingAdditionalCities,

  isLoadingWeather,
  isLoadingHistoricalWeather,

  onCountryChange,
  onCityChange,
  onStartDateChange,
  onEndDateChange,
  onCheckDestination,

  onAdditionalCitySearchToggle,
  onCitySearchQueryChange,
  onAdditionalCitySearchSubmit,
  onAdditionalCitySearchKeyDown,
  onAdditionalCitySelection,
}) {
  const isSelectedCityInMajorCities =
    selectedCity &&
    majorCities.some(
      (city) => city.id === selectedCity.id,
    )

  const isCheckDestinationDisabled =
    !selectedCountryCode ||
    !selectedCity ||
    !startDate ||
    !endDate ||
    isLoadingWeather ||
    isLoadingHistoricalWeather

  return (
    <form
      className="destination-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <section className="destination-form__section">
        <div className="destination-form__section-header">
          <div className="destination-form__section-icon">
            <DestinationIcon />
          </div>

          <div>
            <p className="destination-form__section-step">
              STEP 01
            </p>

            <h2 className="destination-form__section-title">
              Choose your destination
            </h2>

            <p className="destination-form__section-description">
              Select the country and city you would like
              to visit.
            </p>
          </div>
        </div>

        <div className="destination-form__grid">
          <div className="destination-form__field">
            <label
              className="destination-form__label"
              htmlFor="country"
            >
              Country
            </label>

            <div className="destination-form__control">
              <select
                id="country"
                className="destination-form__select"
                value={selectedCountryCode}
                onChange={onCountryChange}
                disabled={
                  isLoadingCountries ||
                  Boolean(countriesError)
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

              <span
                className="destination-form__select-arrow"
                aria-hidden="true"
              >
                ↓
              </span>
            </div>

            {countriesError && (
              <p
                className="destination-form__error"
                role="alert"
              >
                {countriesError}
              </p>
            )}
          </div>

          <div className="destination-form__field">
            <label
              className="destination-form__label"
              htmlFor="city"
            >
              City
            </label>

            <div className="destination-form__control">
              <select
                id="city"
                className="destination-form__select"
                value={
                  selectedCity
                    ? String(selectedCity.id)
                    : ''
                }
                onChange={onCityChange}
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

              <span
                className="destination-form__select-arrow"
                aria-hidden="true"
              >
                ↓
              </span>
            </div>

            {citiesError && (
              <p
                className="destination-form__error"
                role="alert"
              >
                {citiesError}
              </p>
            )}

            {selectedCountryCode &&
              !isLoadingCities &&
              !citiesError && (
                <AdditionalCitySearch
                  isOpen={isAdditionalCitySearchOpen}
                  query={citySearchQuery}
                  results={citySearchResults}
                  error={citySearchError}
                  hasSearched={
                    hasSearchedAdditionalCities
                  }
                  isSearching={
                    isSearchingAdditionalCities
                  }
                  onToggle={
                    onAdditionalCitySearchToggle
                  }
                  onQueryChange={
                    onCitySearchQueryChange
                  }
                  onSearch={
                    onAdditionalCitySearchSubmit
                  }
                  onKeyDown={
                    onAdditionalCitySearchKeyDown
                  }
                  onCitySelection={
                    onAdditionalCitySelection
                  }
                />
              )}
          </div>
        </div>
      </section>

      <div
        className="destination-form__divider"
        aria-hidden="true"
      />

      <section className="destination-form__section">
        <div className="destination-form__section-header">
          <div className="destination-form__section-icon">
            <CalendarIcon />
          </div>

          <div>
            <p className="destination-form__section-step">
              STEP 02
            </p>

            <h2 className="destination-form__section-title">
              Set your travel dates
            </h2>

            <p className="destination-form__section-description">
              Add the dates for your planned journey.
            </p>
          </div>
        </div>

        <div className="destination-form__grid">
          <div className="destination-form__field">
            <label
              className="destination-form__label"
              htmlFor="startDate"
            >
              Start date
            </label>

            <input
              id="startDate"
              className="destination-form__input"
              type="date"
              value={startDate}
              onChange={onStartDateChange}
            />
          </div>

          <div className="destination-form__field">
            <label
              className="destination-form__label"
              htmlFor="endDate"
            >
              End date
            </label>

            <input
              id="endDate"
              className="destination-form__input"
              type="date"
              value={endDate}
              min={startDate}
              onChange={onEndDateChange}
            />
          </div>
        </div>
      </section>

      <div className="destination-form__footer">
        <div className="destination-form__footer-copy">
          <div className="destination-form__footer-heading">
            <span className="destination-form__footer-icon">
              <WeatherIcon />
            </span>

            <div>
              <p className="destination-form__footer-step">
                STEP 03
              </p>

              <h3 className="destination-form__footer-title">
                Check the weather
              </h3>
            </div>
          </div>

          <p className="destination-form__footer-note">
            View the available weather forecast for your
            selected destination and dates before
            creating the trip.
          </p>
        </div>

        <button
          className="destination-form__submit"
          type="button"
          onClick={onCheckDestination}
          disabled={isCheckDestinationDisabled}
        >
          <span>
          {isLoadingWeather
            ? 'Loading forecast...'
            : 'View weather forecast'}
          </span>

          {!isLoadingWeather && (
            <span
              className="destination-form__submit-icon"
              aria-hidden="true"
            >
              <ArrowIcon />
            </span>
          )}
        </button>
      </div>
    </form>
  )
}

export default DestinationForm