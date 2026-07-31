import { useNavigate } from 'react-router-dom'
import DeleteTripSection from '../components/trip-details/DeleteTripSection'
import TripEditForm from '../components/trip-details/TripEditForm'
import TripSummary from '../components/trip-details/TripSummary'
import { useTripDelete } from '../hooks/trip-details/useTripDelete'
import { useTripDetails } from '../hooks/trip-details/useTripDetails'
import { useTripEdit } from '../hooks/trip-details/useTripEdit'

function TripDetailsPage() {
  const navigate = useNavigate()

  const {
    trip,
    isLoadingTrip,
    tripError,
    replaceTrip,
  } = useTripDetails()

  const {
    isEditing,
    title,
    budgetAmount,
    budgetCurrency,
    notes,
    isSaving,
    saveError,
    startEditing,
    cancelEditing,
    saveTrip,
    handleTitleChange,
    handleBudgetAmountChange,
    handleBudgetCurrencyChange,
    handleNotesChange,
  } = useTripEdit({
    trip,
    replaceTrip,
  })

  const {
    isConfirmingDelete,
    isDeleting,
    deleteError,
    startDelete,
    cancelDelete,
    resetDelete,
    confirmDelete,
  } = useTripDelete({
    trip,
  })

  const handleStartEditing = () => {
    resetDelete()
    startEditing()
  }

  if (isLoadingTrip) {
    return (
      <main className="trip-details-page">
        <button
          type="button"
          onClick={() => navigate('/trips')}
        >
          Back to My Trips
        </button>

        <p>Loading trip...</p>
      </main>
    )
  }

  if (tripError || !trip) {
    return (
      <main className="trip-details-page">
        <button
          type="button"
          onClick={() => navigate('/trips')}
        >
          Back to My Trips
        </button>

        <h1>Trip Details</h1>

        <p className="trip-details-page__error">
          {tripError || 'Trip not found.'}
        </p>
      </main>
    )
  }

  return (
    <main className="trip-details-page">
      <button
        type="button"
        onClick={() => navigate('/trips')}
        disabled={isSaving || isDeleting}
      >
        Back to My Trips
      </button>

      <TripSummary trip={trip} />

      {isEditing ? (
        <TripEditForm
          title={title}
          budgetAmount={budgetAmount}
          budgetCurrency={budgetCurrency}
          notes={notes}
          isSaving={isSaving}
          saveError={saveError}
          onTitleChange={handleTitleChange}
          onBudgetAmountChange={
            handleBudgetAmountChange
          }
          onBudgetCurrencyChange={
            handleBudgetCurrencyChange
          }
          onNotesChange={handleNotesChange}
          onSave={saveTrip}
          onCancel={cancelEditing}
        />
      ) : (
        <>
          <button
            type="button"
            onClick={handleStartEditing}
            disabled={isDeleting}
          >
            Edit Trip Details
          </button>

          <DeleteTripSection
            isConfirmingDelete={
              isConfirmingDelete
            }
            isDeleting={isDeleting}
            deleteError={deleteError}
            onStartDelete={startDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
          />
        </>
      )}
    </main>
  )
}

export default TripDetailsPage