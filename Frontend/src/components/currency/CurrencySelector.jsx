import '../../css/components/currency-selector.css'

const POPULAR_CURRENCIES = [
  'ILS',
  'USD',
  'EUR',
  'GBP',
]

function InfoIcon() {
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
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 10.5V17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="7.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  )
}

function CurrencySelector({
  id,
  label,
  value,
  onChange,
  helpText = (
    'Choose a common currency or select ' +
    'Other currency to enter any 3-letter ' +
    'currency code. Uppercase and lowercase ' +
    'letters are accepted automatically.'
  ),
}) {
  const normalizedCurrency =
    typeof value === 'string'
      ? value.trim().toUpperCase()
      : ''

  const selectedCurrencyOption =
    POPULAR_CURRENCIES.includes(
      normalizedCurrency,
    )
      ? normalizedCurrency
      : 'OTHER'

  const isCustomCurrency =
    selectedCurrencyOption === 'OTHER'

  const handleCurrencyOptionChange = (
    event,
  ) => {
    const selectedCurrency =
      event.target.value

    if (selectedCurrency === 'OTHER') {
      onChange('')
      return
    }

    onChange(selectedCurrency)
  }

  const handleCustomCurrencyChange = (
    event,
  ) => {
    onChange(event.target.value)
  }

  const selectId = `${id}-option`
  const helpId = `${id}-help`

  return (
    <div className="currency-selector">
      <div className="currency-selector__label-row">
        <label
          className="currency-selector__label"
          htmlFor={selectId}
        >
          {label}
        </label>

        <span className="currency-selector__info">
          <button
            className="currency-selector__info-button"
            type="button"
            aria-label={`About ${label.toLowerCase()}`}
            aria-describedby={helpId}
          >
            <InfoIcon />
          </button>

          <span
            id={helpId}
            className="currency-selector__tooltip"
            role="tooltip"
          >
            {helpText}
          </span>
        </span>
      </div>

      <div className="currency-selector__controls">
        <select
          id={selectId}
          className="currency-selector__select"
          value={selectedCurrencyOption}
          onChange={handleCurrencyOptionChange}
        >
          {POPULAR_CURRENCIES.map(
            (currency) => (
              <option
                key={currency}
                value={currency}
              >
                {currency}
              </option>
            ),
          )}

          <option value="OTHER">
            Other currency
          </option>
        </select>

        {isCustomCurrency && (
          <input
            className="currency-selector__custom-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck="false"
            maxLength="3"
            placeholder="JPY"
            value={value}
            onChange={handleCustomCurrencyChange}
            aria-label={`Custom ${label.toLowerCase()}`}
          />
        )}
      </div>
    </div>
  )
}

export default CurrencySelector