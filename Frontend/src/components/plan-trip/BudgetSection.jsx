import '../../css/components/budget-section.css'
import CurrencyConversion from '../currency/CurrencyConversion'
import CurrencySelector from '../currency/CurrencySelector'

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

function BudgetSection({
  budgetAmount,
  budgetCurrency,
  localCurrency,
  onBudgetAmountChange,
  onBudgetCurrencyChange,
}) {
  const hasBudget =
    Number.isFinite(Number(budgetAmount)) &&
    Number(budgetAmount) > 0

  const hasValidBudgetCurrency =
    /^[A-Z]{3}$/.test(
      budgetCurrency.trim().toUpperCase(),
    )

  const normalizedBudgetCurrency =
    budgetCurrency.trim().toUpperCase()

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
          <CurrencySelector
            id="trip-budget-currency"
            label="Budget currency"
            value={budgetCurrency}
            onChange={onBudgetCurrencyChange}
          />
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
            normalizedBudgetCurrency !==
              localCurrency && (
              <CurrencyConversion
                amount={budgetAmount}
                fromCurrency={
                  normalizedBudgetCurrency
                }
                toCurrency={localCurrency}
              />
            )}

          {hasBudget &&
            hasValidBudgetCurrency &&
            normalizedBudgetCurrency ===
              localCurrency && (
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