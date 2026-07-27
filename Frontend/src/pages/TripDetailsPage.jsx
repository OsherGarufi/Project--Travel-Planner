import { useEffect, useState } from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router-dom'
import TripEditForm from '../components/trip-details/TripEditForm'
import { useAuth } from '../hooks/useAuth'
import {
    getTripById,
    updateTrip,
} from '../services/tripService'

function TripDetailsPage() {
  const { tripId } = useParams()
  const { idToken } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [isLoadingTrip, setIsLoadingTrip] =
    useState(true)
  const [tripError, setTripError] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBudgetAmount, setEditBudgetAmount] =
    useState('')
  const [editBudgetCurrency, setEditBudgetCurrency] =
    useState('ILS')
  const [editNotes, setEditNotes] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!idToken || !tripId) {
      return undefined
    }

    let isActive = true

    const loadTrip = async () => {
      try {
        setIsLoadingTrip(true)
        setTripError('')

        const tripResult = await getTripById(
          tripId,
          idToken,
        )

        if (!isActive) {
          return
        }

        setTrip(tripResult)
      } catch (error) {
        if (!isActive) {
          return
        }

        console.error(
          'Failed to load trip details:',
          error,
        )

        setTrip(null)
        setTripError(
          'Could not load this trip. Please try again.',
        )
      } finally {
        if (isActive) {
          setIsLoadingTrip(false)
        }
      }
    }

    loadTrip()

    return () => {
      isActive = false
    }
  }, [idToken, tripId])

  const fillEditForm = (tripDetails) => {
    setEditTitle(tripDetails.title)
    setEditBudgetAmount(
      tripDetails.budgetAmount?.toString() ?? '',
    )
    setEditBudgetCurrency(
      tripDetails.budgetCurrency || 'ILS',
    )
    setEditNotes(tripDetails.notes || '')
  }

  const handleStartEditing = () => {
    fillEditForm(trip)
    setSaveError('')
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    fillEditForm(trip)
    setSaveError('')
    setIsEditing(false)
  }

  const handleBudgetCurrencyChange = (event) => {
    setEditBudgetCurrency(
      event.target.value.toUpperCase(),
    )
    setSaveError('')
  }

  const handleSaveTrip = async () => {
    const normalizedTitle = editTitle.trim()
    const normalizedCurrency =
      editBudgetCurrency.trim().toUpperCase()

    if (!normalizedTitle) {
      setSaveError('Trip title is required.')
      return
    }

    if (normalizedCurrency.length !== 3) {
      setSaveError(
        'Currency must contain exactly 3 characters.',
      )
      return
    }

    const normalizedBudgetAmount =
      editBudgetAmount === ''
        ? null
        : Number(editBudgetAmount)

    if (
      normalizedBudgetAmount !== null &&
      (!Number.isFinite(normalizedBudgetAmount) ||
        normalizedBudgetAmount < 0)
    ) {
      setSaveError(
        'Budget must be a valid non-negative number.',
      )
      return
    }

    const normalizedNotes =
      editNotes.trim() || null

    const tripData = {
      title: normalizedTitle,
      destinationCountryCode:
        trip.destinationCountryCode,
      destinationCountryName:
        trip.destinationCountryName,
      destinationCity: trip.destinationCity,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budgetAmount: normalizedBudgetAmount,
      budgetCurrency: normalizedCurrency,
      notes: normalizedNotes,
    }

    try {
      setIsSaving(true)
      setSaveError('')

      const updateResult = await updateTrip(
        trip.id,
        tripData,
        idToken,
      )

      const updatedTrip =
        updateResult &&
        typeof updateResult === 'object'
          ? updateResult
          : {
              ...trip,
              ...tripData,
            }

      setTrip(updatedTrip)
      setIsEditing(false)
    } catch (error) {
      console.error(
        'Failed to update trip:',
        error,
      )

      setSaveError(
        'Could not save the changes. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
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
        disabled={isSaving}
      >
        Back to My Trips
      </button>

      <h1>{trip.title}</h1>

      <section className="trip-details-page__summary">
        <h2>Trip Summary</h2>

        <p>
          Destination: {trip.destinationCity},{' '}
          {trip.destinationCountryName}
        </p>

        <p>
          Dates: {trip.startDate} - {trip.endDate}
        </p>

        {trip.budgetAmount !== null && (
          <p>
            Budget: {trip.budgetAmount}{' '}
            {trip.budgetCurrency}
          </p>
        )}

        {trip.notes && (
          <div>
            <h3>Notes</h3>
            <p>{trip.notes}</p>
          </div>
        )}
      </section>

      {isEditing ? (
        <TripEditForm
          title={editTitle}
          budgetAmount={editBudgetAmount}
          budgetCurrency={editBudgetCurrency}
          notes={editNotes}
          isSaving={isSaving}
          saveError={saveError}
          onTitleChange={(event) => {
            setEditTitle(event.target.value)
            setSaveError('')
          }}
          onBudgetAmountChange={(event) => {
            setEditBudgetAmount(event.target.value)
            setSaveError('')
          }}
          onBudgetCurrencyChange={
            handleBudgetCurrencyChange
          }
          onNotesChange={(event) => {
            setEditNotes(event.target.value)
            setSaveError('')
          }}
          onSave={handleSaveTrip}
          onCancel={handleCancelEditing}
        />
      ) : (
        <button
          type="button"
          onClick={handleStartEditing}
        >
          Edit Trip Details
        </button>
      )}
    </main>
  )
}

export default TripDetailsPage