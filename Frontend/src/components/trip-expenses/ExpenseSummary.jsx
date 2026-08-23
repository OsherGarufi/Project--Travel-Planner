import '../../css/components/expense-summary.css'

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
  if (!hasExpenses) {
    return null
  }

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

  const progressPercentage =
    typeof percentageUsed === 'number'
      ? Math.min(
          Math.max(percentageUsed, 0),
          100,
        )
      : 0

  return (
    <div className="expense-summary">
      <div className="expense-summary__grid">
        {hasBudget && (
          <div className="expense-summary__stat">
            <p className="expense-summary__label">
              Planned budget
            </p>

            <p className="expense-summary__value">
              {formatMoney(budgetAmount)}
              <span>
                {currency}
              </span>
            </p>
          </div>
        )}

        <div className="expense-summary__stat">
          <p className="expense-summary__label">
            {isEstimated
              ? 'Estimated spent'
              : 'Spent'}
          </p>

          <p className="expense-summary__value">
            {isEstimated && (
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
                {isEstimated && (
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

      {hasBudget &&
        typeof percentageUsed ===
          'number' && (
          <div className="expense-summary__progress">
            <div className="expense-summary__progress-header">
              <span>
                Budget used
              </span>

              <strong>
                {Math.round(
                  percentageUsed,
                )}
                %
              </strong>
            </div>

            <div
              className="expense-summary__progress-track"
              role="progressbar"
              aria-label="Budget used"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={
                progressPercentage
              }
            >
              <span
                className="expense-summary__progress-value"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
          </div>
        )}

      {isEstimated && (
        <p className="expense-summary__note">
          Approximate total based on available exchange rates.
        </p>
      )}
    </div>
  )
}

export default ExpenseSummary