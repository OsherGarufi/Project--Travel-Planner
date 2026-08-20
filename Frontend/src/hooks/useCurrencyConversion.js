import { useEffect, useMemo, useState } from 'react'
import { getExchangeRate } from '../services/currencyService'

function normalizeCurrency(currency) {
  if (typeof currency !== 'string') {
    return null
  }

  const normalizedCurrency = currency.trim().toUpperCase()

  return normalizedCurrency || null
}

export function useCurrencyConversion(
  amount,
  fromCurrency,
  toCurrency,
) {
  const normalizedFromCurrency = normalizeCurrency(fromCurrency)
  const normalizedToCurrency = normalizeCurrency(toCurrency)

  const numericAmount = Number(amount)

  const hasValidAmount =
    Number.isFinite(numericAmount) && numericAmount > 0

  const requestKey =
    hasValidAmount &&
    normalizedFromCurrency &&
    normalizedToCurrency
      ? `${normalizedFromCurrency}:${normalizedToCurrency}`
      : null

  const [rateState, setRateState] = useState({
    requestKey: null,
    result: null,
  })

  useEffect(() => {
    if (!requestKey) {
      return undefined
    }

    let isCancelled = false

    async function loadExchangeRate() {
      const result = await getExchangeRate(
        normalizedFromCurrency,
        normalizedToCurrency,
      )

      if (!isCancelled) {
        setRateState({
          requestKey,
          result,
        })
      }
    }

    loadExchangeRate()

    return () => {
      isCancelled = true
    }
  }, [
    requestKey,
    normalizedFromCurrency,
    normalizedToCurrency,
  ])

  const currentResult =
    rateState.requestKey === requestKey
      ? rateState.result
      : null

  const isLoading = Boolean(requestKey && !currentResult)

  const convertedAmount = useMemo(() => {
    if (
      !currentResult ||
      typeof currentResult.rate !== 'number'
    ) {
      return null
    }

    return numericAmount * currentResult.rate
  }, [currentResult, numericAmount])

  if (!requestKey) {
    return {
      status: 'idle',
      source: null,
      rate: null,
      date: null,
      convertedAmount: null,
      isLoading: false,
    }
  }

  if (isLoading) {
    return {
      status: 'loading',
      source: null,
      rate: null,
      date: null,
      convertedAmount: null,
      isLoading: true,
    }
  }

  return {
    status: currentResult.status,
    source: currentResult.source ?? null,
    rate: currentResult.rate,
    date: currentResult.date,
    convertedAmount,
    isLoading: false,
  }
}