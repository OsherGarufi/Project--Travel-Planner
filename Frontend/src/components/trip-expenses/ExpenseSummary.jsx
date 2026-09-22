import '../../css/components/expense-summary.css'
import BudgetProgress from './BudgetProgress'

function formatMoney(amount) {
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount)
  ) {
    return null
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
}

function ExpenseSummary({
  status,
  currency,
  hasExpenses,
  hasBudget,
  budgetAmount,
  spentAmount,
  remainingAmount,
  percentageUsed,
  isEstimated,
}) {
  if (status === 'loading') {
    return (
      <div
        className="expense-summary expense-summary--loading"
        aria-live="polite"
      >
        <p className="expense-summary__message">
          Calculating your trip spending...
        </p>
      </div>
    )
  }

  if (
    status === 'unavailable' ||
    spentAmount === null ||
    !currency
  ) {
    return (
      <div
        className="expense-summary expense-summary--unavailable"
        aria-live="polite"
      >
        <p className="expense-summary__message">
          Estimated trip total is temporarily unavailable.
        </p>

        <p className="expense-summary__message-detail">
          Your expenses are still saved and available below.
        </p>
      </div>
    )
  }

  const isOverBudget =
    hasBudget &&
    remainingAmount !== null &&
    remainingAmount < 0

  const spentLabel =
    hasExpenses && isEstimated
      ? 'Estimated spent'
      : 'Spent'

  return (
    <div className="expense-summary">
      <div className="expense-summary__grid">
        <div className="expense-summary__stat">
          <p className="expense-summary__label">
            Planned budget
          </p>

          {hasBudget ? (
            <p className="expense-summary__value">
              {formatMoney(budgetAmount)}

              <span>
                {currency}
              </span>
            </p>
          ) : (
            <p className="expense-summary__value">
              Not set
            </p>
          )}
        </div>

        <div className="expense-summary__stat">
          <p className="expense-summary__label">
            {spentLabel}
          </p>

          <p className="expense-summary__value">
            {hasExpenses &&
              isEstimated && (
                <span
                  className="expense-summary__approx"
                  aria-hidden="true"
                >
                  ≈
                </span>
              )}

            {formatMoney(spentAmount)}

            <span>
              {currency}
            </span>
          </p>
        </div>

        {hasBudget &&
          remainingAmount !== null && (
            <div className="expense-summary__stat">
              <p className="expense-summary__label">
                {isOverBudget
                  ? 'Over budget'
                  : 'Remaining'}
              </p>

              <p
                className={
                  isOverBudget
                    ? 'expense-summary__value expense-summary__value--danger'
                    : 'expense-summary__value'
                }
              >
                {hasExpenses &&
                  isEstimated && (
                    <span
                      className="expense-summary__approx"
                      aria-hidden="true"
                    >
                      ≈
                    </span>
                  )}

                {formatMoney(
                  remainingAmount,
                )}

                <span>
                  {currency}
                </span>
              </p>
            </div>
          )}
      </div>

      {hasBudget && (
        <BudgetProgress
          percentageUsed={percentageUsed}
        />
      )}

      {hasExpenses &&
        isEstimated && (
          <p className="expense-summary__note">
            Approximate total based on available exchange rates.
          </p>
        )}
    </div>
  )
}

export default ExpenseSummary
