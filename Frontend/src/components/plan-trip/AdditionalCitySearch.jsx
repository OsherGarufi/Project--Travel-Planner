function AdditionalCitySearch({
  isOpen,
  query,
  results,
  error,
  hasSearched,
  isSearching,
  onToggle,
  onQueryChange,
  onSearch,
  onKeyDown,
  onCitySelection,
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
      >
        {isOpen
          ? 'Close city search'
          : "Can't find your city? Search for another city"}
      </button>

      {isOpen && (
        <div className="additional-city-search">
          <label htmlFor="additionalCitySearch">
            Search for another city
          </label>

          <input
            id="additionalCitySearch"
            type="text"
            value={query}
            onChange={onQueryChange}
            onKeyDown={onKeyDown}
            placeholder="Enter a city name"
            autoComplete="off"
          />

          <button
            type="button"
            onClick={onSearch}
            disabled={
              isSearching ||
              query.trim().length < 2
            }
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>

          {error && (
            <p className="additional-city-search__error">
              {error}
            </p>
          )}

          {hasSearched &&
            !isSearching &&
            !error &&
            results.length === 0 && (
              <p className="additional-city-search__empty">
                No matching cities were found.
              </p>
            )}

          {results.length > 0 && (
            <div className="additional-city-search__results">
              <p>Select a city:</p>

              {results.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onCitySelection(city)}
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default AdditionalCitySearch