import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import { getExchangeRate } from '../../services/currencyService'

function normalizeCurrency(currency) {
  if (typeof currency !== 'string') {
    return null
  }

  const normalizedCurrency =
    currency.trim().toUpperCase()

  if (
    !/^[A-Z]{3}$/.test(
      normalizedCurrency,
    )
  ) {
    return null
  }

  return normalizedCurrency
}

export function useExpenseSummary({
  expenses,
  budgetAmount,
  budgetCurrency,
}) {
  const targetCurrency =
    normalizeCurrency(budgetCurrency)

  const expenseTotals = useMemo(() => {
    const totals = new Map()
    let hasInvalidExpense = false

    for (const expense of expenses) {
      const currency =
        normalizeCurrency(
          expense?.currency,
        )

      const amount =
        Number(expense?.amount)

      if (
        !currency ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        hasInvalidExpense = true
        continue
      }

      totals.set(
        currency,
        (totals.get(currency) ?? 0) +
          amount,
      )
    }

    return {
      totals,
      hasInvalidExpense,
    }
  }, [expenses])

  const conversionCurrencies =
    useMemo(() => {
      if (!targetCurrency) {
        return []
      }

      return Array.from(
        expenseTotals.totals.keys(),
      )
        .filter(
          (currency) =>
            currency !== targetCurrency,
        )
        .sort()
    }, [
      expenseTotals.totals,
      targetCurrency,
    ])

  const rateRequestKey =
    targetCurrency &&
    !expenseTotals.hasInvalidExpense &&
    conversionCurrencies.length > 0
      ? `${targetCurrency}:${conversionCurrencies.join(',')}`
      : null

  const [rateState, setRateState] =
    useState({
      requestKey: null,
      results: [],
    })

  useEffect(() => {
    if (!rateRequestKey) {
      return undefined
    }

    let isActive = true

    Promise.all(
      conversionCurrencies.map(
        async (fromCurrency) => {
          const result =
            await getExchangeRate(
              fromCurrency,
              targetCurrency,
            )

          return {
            fromCurrency,
            result,
          }
        },
      ),
    )
      .then((results) => {
        if (!isActive) {
          return
        }

        setRateState({
          requestKey: rateRequestKey,
          results,
        })
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        console.error(
          'Failed to calculate expense summary:',
          error,
        )

        setRateState({
          requestKey: rateRequestKey,
          results: conversionCurrencies.map(
            (fromCurrency) => ({
              fromCurrency,
              result: {
                status: 'unavailable',
                rate: null,
              },
            }),
          ),
        })
      })

    return () => {
      isActive = false
    }
  }, [
    conversionCurrencies,
    rateRequestKey,
    targetCurrency,
  ])

  const currentRateResults =
    rateState.requestKey ===
    rateRequestKey
      ? rateState.results
      : null

  const hasExpenses =
    expenseTotals.totals.size > 0

  const isLoading =
    Boolean(
      rateRequestKey &&
      !currentRateResults,
    )

  const hasUnavailableRate =
    currentRateResults?.some(
      ({ result }) =>
        result.status ===
          'unavailable' ||
        typeof result.rate !==
          'number',
    ) ?? false

  const hasStaleRate =
    currentRateResults?.some(
      ({ result }) =>
        result.status === 'stale',
    ) ?? false

  const spentAmount = useMemo(() => {
    if (
      !targetCurrency ||
      expenseTotals.hasInvalidExpense ||
      isLoading ||
      hasUnavailableRate
    ) {
      return null
    }

    const ratesByCurrency =
      new Map(
        (currentRateResults ?? []).map(
          ({
            fromCurrency,
            result,
          }) => [
            fromCurrency,
            result.rate,
          ],
        ),
      )

    let total = 0

    for (
      const [
        currency,
        amount,
      ] of expenseTotals.totals
    ) {
      if (
        currency === targetCurrency
      ) {
        total += amount
        continue
      }

      const rate =
        ratesByCurrency.get(currency)

      if (
        typeof rate !== 'number' ||
        !Number.isFinite(rate) ||
        rate <= 0
      ) {
        return null
      }

      total += amount * rate
    }

    return total
  }, [
    currentRateResults,
    expenseTotals,
    hasUnavailableRate,
    isLoading,
    targetCurrency,
  ])

  const numericBudgetAmount =
    Number(budgetAmount)

  const hasBudget =
    Number.isFinite(
      numericBudgetAmount,
    ) &&
    numericBudgetAmount > 0

  const remainingAmount =
    hasBudget &&
    spentAmount !== null
      ? numericBudgetAmount -
        spentAmount
      : null

  const percentageUsed =
    hasBudget &&
    spentAmount !== null
      ? (
          spentAmount /
          numericBudgetAmount
        ) * 100
      : null

  let status = 'success'

  if (
    !targetCurrency ||
    expenseTotals.hasInvalidExpense
  ) {
    status = 'unavailable'
  } else if (isLoading) {
    status = 'loading'
  } else if (hasUnavailableRate) {
    status = 'unavailable'
  } else if (hasStaleRate) {
    status = 'stale'
  }

  return {
    status,
    isLoading,

    currency: targetCurrency,

    hasExpenses,
    hasBudget,

    budgetAmount:
      hasBudget
        ? numericBudgetAmount
        : null,

    spentAmount,
    remainingAmount,
    percentageUsed,

    isEstimated:
      conversionCurrencies.length > 0,

    hasStaleRate,
  }
}