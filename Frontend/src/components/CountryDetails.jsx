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

  return (
    <section>
      <h2>{country.name}</h2>

      {country.flagUrl && (
        <img
          src={country.flagUrl}
          alt={`Flag of ${country.name}`}
          width="240"
        />
      )}

      <dl>
        <div>
          <dt>Country code</dt>
          <dd>{country.code}</dd>
        </div>

        <div>
          <dt>Capital</dt>
          <dd>{country.capital || 'Not available'}</dd>
        </div>

        <div>
          <dt>Region</dt>
          <dd>{country.region || 'Not available'}</dd>
        </div>

        <div>
          <dt>Population</dt>
          <dd>{population}</dd>
        </div>

        <div>
          <dt>Currencies</dt>
          <dd>{currencies}</dd>
        </div>

        <div>
          <dt>Languages</dt>
          <dd>{languages}</dd>
        </div>
      </dl>
    </section>
  )
}

export default CountryDetails