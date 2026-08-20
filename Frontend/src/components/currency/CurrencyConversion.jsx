import { useCurrencyConversion } from '../../hooks/useCurrencyConversion'

function formatAmount(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatRateDate(date) {
  if (!date) {
    return null
  }

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate)
}

export default function CurrencyConversion({
  amount,
  fromCurrency,
  toCurrency,
}) {
  const {
    status,
    source,
    date,
    convertedAmount,
    isLoading,
  } = useCurrencyConversion(
    amount,
    fromCurrency,
    toCurrency,
  )

  if (!amount || !fromCurrency || !toCurrency) {
    return null
  }

  if (source === 'same-currency') {
    return null
  }

  if (isLoading) {
    return (
      <div className="currency-conversion" aria-live="polite">
        <span className="currency-conversion__message">
          Calculating local value...
        </span>
      </div>
    )
  }

  if (
    status === 'unavailable' ||
    convertedAmount === null
  ) {
    return (
      <div className="currency-conversion" aria-live="polite">
        <span className="currency-conversion__message">
          Exchange rate temporarily unavailable
        </span>
      </div>
    )
  }

  const formattedDate = formatRateDate(date)

  return (
    <div className="currency-conversion" aria-live="polite">
      <div className="currency-conversion__value">
        ≈ {formatAmount(convertedAmount)} {toCurrency}
      </div>

      {status === 'stale' ? (
        <div className="currency-conversion__meta">
          Last available exchange rate
          {formattedDate ? ` · ${formattedDate}` : ''}
        </div>
      ) : (
        <div className="currency-conversion__meta">
          Estimated using current exchange rate
        </div>
      )}
    </div>
  )
}