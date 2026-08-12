import '../css/components/country-details.css'

function CapitalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 20h16M6 20v-8h12v8M5 12l7-8 7 8M10 20v-5h4v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PopulationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 19c.4-3.4 2.3-5.2 5.5-5.2s5.1 1.8 5.5 5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15.5 6.3a3 3 0 0 1 0 5.4M17 14c2.1.7 3.2 2.4 3.5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CurrencyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M15 8.5c-.8-.7-1.8-1-3-1-1.8 0-3 .9-3 2.2 0 3.4 6.2 1.6 6.2 4.8 0 1.4-1.3 2.3-3.2 2.3-1.3 0-2.5-.4-3.4-1.2M12 5.5v2M12 16.8v1.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LanguageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 5h10M9 5c-.2 5-2.2 8.5-5.5 10.8M6.5 10.5c1.5 2 3.3 3.6 5.5 4.8M14 19l3.5-9 3.5 9M15.3 16h4.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CountryDetails({ country }) {
  if (!country) {
    return null
  }

  const currencies =
    country.currencies?.length > 0
      ? country.currencies.join(', ')
      : 'Not available'

  const languages =
    country.languages?.length > 0
      ? country.languages.join(', ')
      : 'Not available'

  const population =
    typeof country.population === 'number'
      ? country.population.toLocaleString()
      : 'Not available'

  const details = [
    {
      id: 'capital',
      label: 'Capital',
      value: country.capital || 'Not available',
      icon: <CapitalIcon />,
    },
    {
      id: 'population',
      label: 'Population',
      value: population,
      icon: <PopulationIcon />,
    },
    {
      id: 'currencies',
      label: 'Currency',
      value: currencies,
      icon: <CurrencyIcon />,
    },
    {
      id: 'languages',
      label: 'Languages',
      value: languages,
      icon: <LanguageIcon />,
    },
  ]

  return (
    <section
      className="country-details"
      aria-labelledby="country-details-title"
    >
      <div className="country-details__header">
        <div className="country-details__identity">
          {country.flagUrl && (
            <div className="country-details__flag-wrapper">
              <img
                className="country-details__flag"
                src={country.flagUrl}
                alt={`Flag of ${country.name}`}
              />
            </div>
          )}

          <div className="country-details__heading">
            <p className="country-details__eyebrow">
              COUNTRY OVERVIEW
            </p>

            <h2
              id="country-details-title"
              className="country-details__title"
            >
              {country.name}
            </h2>

            <div className="country-details__meta">
              {country.region && (
                <span>{country.region}</span>
              )}

              {country.region && country.code && (
                <span
                  className="country-details__meta-divider"
                  aria-hidden="true"
                >
                  •
                </span>
              )}

              {country.code && (
                <span>{country.code}</span>
              )}
            </div>
          </div>
        </div>

        <span className="country-details__badge">
          Destination selected
        </span>
      </div>

      <dl className="country-details__grid">
        {details.map((detail) => (
          <div
            key={detail.id}
            className="country-details__item"
          >
            <div
              className="country-details__item-icon"
              aria-hidden="true"
            >
              {detail.icon}
            </div>

            <div className="country-details__item-copy">
              <dt className="country-details__label">
                {detail.label}
              </dt>

              <dd className="country-details__value">
                {detail.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default CountryDetails