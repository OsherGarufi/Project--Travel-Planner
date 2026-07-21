import AdditionalCitySearch from './AdditionalCitySearch'

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
      <div className="destination-form__field">
        <label htmlFor="country">Country</label>

        <select
          id="country"
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

        {countriesError && (
          <p className="destination-form__error">
            {countriesError}
          </p>
        )}
      </div>

      <div className="destination-form__field">
        <label htmlFor="city">City</label>

        <select
          id="city"
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

        {citiesError && (
          <p className="destination-form__error">
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

      <div className="destination-form__field">
        <label htmlFor="startDate">
          Start date
        </label>

        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={onStartDateChange}
        />
      </div>

      <div className="destination-form__field">
        <label htmlFor="endDate">
          End date
        </label>

        <input
          id="endDate"
          type="date"
          value={endDate}
          min={startDate}
          onChange={onEndDateChange}
        />
      </div>

      <button
        type="button"
        onClick={onCheckDestination}
        disabled={isCheckDestinationDisabled}
      >
        {isLoadingWeather
          ? 'Checking Destination...'
          : 'Check Destination'}
      </button>
    </form>
  )
}

export default DestinationForm