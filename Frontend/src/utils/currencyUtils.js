const PREFERRED_CURRENCIES = ['USD', 'EUR', 'GBP']

export function getPreferredLocalCurrency(currencies) {
  if (!Array.isArray(currencies) || currencies.length === 0) {
    return null
  }

  const normalizedCurrencies = currencies
    .filter((currency) => typeof currency === 'string')
    .map((currency) => currency.trim().toUpperCase())
    .filter(Boolean)

  if (normalizedCurrencies.length === 0) {
    return null
  }

  const preferredCurrency = PREFERRED_CURRENCIES.find((currency) =>
    normalizedCurrencies.includes(currency),
  )

  return preferredCurrency ?? normalizedCurrencies[0]
}