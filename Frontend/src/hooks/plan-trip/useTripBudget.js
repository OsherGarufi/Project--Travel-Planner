import { useMemo, useState } from 'react'

const DEFAULT_BUDGET_CURRENCY = 'ILS'

function normalizeCurrencyInput(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
}

export function useTripBudget() {
  const [budgetAmount, setBudgetAmount] =
    useState('')

  const [budgetCurrency, setBudgetCurrency] =
    useState(DEFAULT_BUDGET_CURRENCY)

  const parsedBudgetAmount = useMemo(() => {
    if (budgetAmount === '') {
      return null
    }

    const numericAmount = Number(budgetAmount)

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return null
    }

    return numericAmount
  }, [budgetAmount])

  const isBudgetValid =
    parsedBudgetAmount !== null &&
    /^[A-Z]{3}$/.test(budgetCurrency)

  const handleBudgetAmountChange = (event) => {
    setBudgetAmount(event.target.value)
  }

  const handleBudgetCurrencyChange = (value) => {
    setBudgetCurrency(
      normalizeCurrencyInput(value),
    )
  }

  return {
    budgetAmount,
    parsedBudgetAmount,
    budgetCurrency,
    isBudgetValid,
    handleBudgetAmountChange,
    handleBudgetCurrencyChange,
  }
}