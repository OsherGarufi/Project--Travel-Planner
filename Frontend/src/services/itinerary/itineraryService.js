import { apiRequest } from '../apiClient'

export function getTripItinerary(
  tripId,
  idToken,
) {
  return apiRequest(
    `/api/Trips/${tripId}/itinerary`,
    {},
    idToken,
  )
}

export function createTripItineraryItem(
  tripId,
  itemData,
  idToken,
) {
  return apiRequest(
    `/api/Trips/${tripId}/itinerary`,
    {
      method: 'POST',
      body: JSON.stringify(itemData),
    },
    idToken,
  )
}

export function updateTripItineraryItem(
  tripId,
  itemId,
  itemData,
  idToken,
) {
  return apiRequest(
    `/api/Trips/${tripId}/itinerary/${itemId}`,
    {
      method: 'PUT',
      body: JSON.stringify(itemData),
    },
    idToken,
  )
}

export function deleteTripItineraryItem(
  tripId,
  itemId,
  idToken,
) {
  return apiRequest(
    `/api/Trips/${tripId}/itinerary/${itemId}`,
    {
      method: 'DELETE',
    },
    idToken,
  )
}