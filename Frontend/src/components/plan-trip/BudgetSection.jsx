import { useState } from 'react'
import CurrencyConversion from '../currency/CurrencyConversion'
import '../../css/components/budget-section.css'

const POPULAR_CURRENCIES = [
  'ILS',
  'USD',
  'EUR',
  'GBP',
]

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V7.5A3.5 3.5 0 0 1 6.5 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 10h5v5h-5a2.5 2.5 0 0 1 0-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="16.5"
        cy="12.5"
        r=".75"
        fill="currentColor"
      />
    </svg>
  )
}

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

function BudgetSection({
  budgetAmount,
  budgetCurrency,
  localCurrency,
  onBudgetAmountChange,
  onBudgetCurrencyChange,
}) {
  const [isCustomCurrency, setIsCustomCurrency] =
    useState(
      !POPULAR_CURRENCIES.includes(
        budgetCurrency,
      ),
    )

  const hasBudget =
    Number.isFinite(Number(budgetAmount)) &&
    Number(budgetAmount) > 0

  const hasValidBudgetCurrency =
    /^[A-Z]{3}$/.test(budgetCurrency)

  const handleCurrencyOptionChange = (event) => {
    const selectedCurrency = event.target.value

    if (selectedCurrency === 'OTHER') {
      setIsCustomCurrency(true)
      onBudgetCurrencyChange('')
      return
    }

    setIsCustomCurrency(false)
    onBudgetCurrencyChange(selectedCurrency)
  }

  const handleCustomCurrencyChange = (event) => {
    onBudgetCurrencyChange(event.target.value)
  }

  const selectedCurrencyOption =
    isCustomCurrency
      ? 'OTHER'
      : budgetCurrency

  return (
    <section
      className="budget-section"
      aria-labelledby="budget-section-title"
    >
      <div className="budget-section__header">
        <div className="budget-section__heading">
          <span
            className="budget-section__icon"
            aria-hidden="true"
          >
            <WalletIcon />
          </span>

          <div>
            <p className="budget-section__eyebrow">
              TRIP BUDGET
            </p>

            <h2
              id="budget-section-title"
              className="budget-section__title"
            >
              Set your planned budget
            </h2>

            <p className="budget-section__description">
              Add your planned amount and choose the
              currency you use for your budget.
            </p>
          </div>
        </div>
      </div>

      <div className="budget-section__fields">
        <div className="budget-section__field">
          <label
            className="budget-section__label"
            htmlFor="trip-budget-amount"
          >
            Budget amount
          </label>

          <input
            id="trip-budget-amount"
            className="budget-section__input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="5000"
            value={budgetAmount}
            onChange={onBudgetAmountChange}
          />
        </div>

        <div className="budget-section__field">
          <div className="budget-section__currency-label-row">
            <label
              className="budget-section__label"
              htmlFor="trip-budget-currency-option"
            >
              Budget currency
            </label>

            <span className="budget-section__info">
              <button
                className="budget-section__info-button"
                type="button"
                aria-label="About budget currency"
                aria-describedby="budget-currency-help"
              >
                <InfoIcon />
              </button>

              <span
                id="budget-currency-help"
                className="budget-section__tooltip"
                role="tooltip"
              >
                Choose a common currency or select
                Other currency to enter any 3-letter
                currency code. Uppercase and lowercase
                letters are accepted automatically.
              </span>
            </span>
          </div>

          <div className="budget-section__currency-controls">
            <select
              id="trip-budget-currency-option"
              className="budget-section__select"
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
                className="budget-section__input budget-section__custom-currency-input"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                maxLength="3"
                placeholder="JPY"
                value={budgetCurrency}
                onChange={handleCustomCurrencyChange}
                aria-label="Custom budget currency"
              />
            )}
          </div>
        </div>
      </div>

      {localCurrency && (
        <div className="budget-section__local">
          <div className="budget-section__local-header">
            <p className="budget-section__local-label">
              Local currency
            </p>

            <p className="budget-section__local-currency">
              {localCurrency}
            </p>
          </div>

          {hasBudget &&
            hasValidBudgetCurrency &&
            budgetCurrency !== localCurrency && (
              <CurrencyConversion
                amount={budgetAmount}
                fromCurrency={budgetCurrency}
                toCurrency={localCurrency}
              />
            )}

          {hasBudget &&
            hasValidBudgetCurrency &&
            budgetCurrency === localCurrency && (
              <p className="budget-section__same-currency">
                Your budget is already in the local
                currency.
              </p>
            )}
        </div>
      )}
    </section>
  )
}

export default BudgetSection