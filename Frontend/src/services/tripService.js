import { apiRequest } from './apiClient'

export function getTrips(idToken) {
  return apiRequest('/api/Trips', {}, idToken)
}

export function getTripById(tripId, idToken) {
  return apiRequest(`/api/Trips/${tripId}`, {}, idToken)
}

export function createTrip(tripData, idToken) {
  return apiRequest(
    '/api/Trips',
    {
      method: 'POST',
      body: JSON.stringify(tripData),
    },
    idToken,
  )
}

export function updateTrip(tripId, tripData, idToken) {
  return apiRequest(
    `/api/Trips/${tripId}`,
    {
      method: 'PUT',
      body: JSON.stringify(tripData),
    },
    idToken,
  )
}

export function deleteTrip(tripId, idToken) {
  return apiRequest(
    `/api/Trips/${tripId}`,
    {
      method: 'DELETE',
    },
    idToken,
  )
}