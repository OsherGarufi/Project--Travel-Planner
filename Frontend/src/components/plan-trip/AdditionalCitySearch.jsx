import {
  MIN_CITY_SEARCH_QUERY_LENGTH,
} from '../../services/city/cityConstants'
import '../../css/components/additional-city-search.css'

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

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
  const isSearchDisabled =
    isSearching ||
    query.trim().length <
      MIN_CITY_SEARCH_QUERY_LENGTH

  return (
    <div className="additional-city-search">
      <button
        className="additional-city-search__toggle"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span
          className="additional-city-search__toggle-icon"
          aria-hidden="true"
        >
          <SearchIcon />
        </span>

        <span>
          {isOpen
            ? 'Close city search'
            : "Can't find your city? Search another"}
        </span>
      </button>

      {isOpen && (
        <div className="additional-city-search__panel">
          <label
            className="additional-city-search__label"
            htmlFor="additionalCitySearch"
          >
            Search another city
          </label>

          <div className="additional-city-search__controls">
            <div className="additional-city-search__input-wrapper">
              <span
                className="additional-city-search__input-icon"
                aria-hidden="true"
              >
                <SearchIcon />
              </span>

              <input
                id="additionalCitySearch"
                className="additional-city-search__input"
                type="text"
                value={query}
                onChange={onQueryChange}
                onKeyDown={onKeyDown}
                placeholder="Enter a city name"
                autoComplete="off"
              />
            </div>

            <button
              className="additional-city-search__button"
              type="button"
              onClick={onSearch}
              disabled={isSearchDisabled}
            >
              {isSearching
                ? 'Searching...'
                : 'Search'}
            </button>
          </div>

          {error && (
            <p
              className="additional-city-search__error"
              role="alert"
            >
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
              <p className="additional-city-search__results-label">
                Select a city
              </p>

              <div className="additional-city-search__results-list">
                {results.map((city) => (
                  <button
                    key={city.id}
                    className="additional-city-search__result"
                    type="button"
                    onClick={() =>
                      onCitySelection(city)
                    }
                  >
                    <span className="additional-city-search__result-dot" />

                    <span className="additional-city-search__result-name">
                      {city.name}
                    </span>

                    <span
                      className="additional-city-search__result-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdditionalCitySearch