import { apiRequest } from './apiClient'

export function getTripExpenses(
  tripId,
  idToken,
) {
  return apiRequest(
    `/api/Trips/${tripId}/expenses`,
    {},
    idToken,
  )
}

export function createTripExpense(
  tripId,
  expenseData,
  idToken,
) {
  return apiRequest(
    `/api/Trips/${tripId}/expenses`,
    {
      method: 'POST',
      body: JSON.stringify(expenseData),
    },
    idToken,
  )
}

export function updateTripExpense(
  tripId,
  expenseId,
  expenseData,
  idToken,
) {
  return apiRequest(
    `/api/Trips/${tripId}/expenses/${expenseId}`,
    {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    },
    idToken,
  )
}

export function deleteTripExpense(
  tripId,
  expenseId,
  idToken,
) {
  return apiRequest(
    `/api/Trips/${tripId}/expenses/${expenseId}`,
    {
      method: 'DELETE',
    },
    idToken,
  )
}