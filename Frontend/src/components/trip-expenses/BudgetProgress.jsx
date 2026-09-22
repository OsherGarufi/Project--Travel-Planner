import '../../css/components/budget-progress.css'

function BudgetProgress({
  percentageUsed,
}) {
  if (
    typeof percentageUsed !== 'number' ||
    !Number.isFinite(percentageUsed)
  ) {
    return null
  }

  const progressPercentage = Math.min(
    Math.max(percentageUsed, 0),
    100,
  )

  return (
    <div className="budget-progress">
      <div className="budget-progress__header">
        <span>Budget used</span>

        <strong>
          {Math.round(percentageUsed)}%
        </strong>
      </div>

      <div
        className="budget-progress__track"
        role="progressbar"
        aria-label="Budget used"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progressPercentage}
        aria-valuetext={`${Math.round(percentageUsed)}% of budget used`}
      >
        <span
          className="budget-progress__value"
          style={{
            width: `${progressPercentage}%`,
          }}
        />
      </div>
    </div>
  )
}

export default BudgetProgress
