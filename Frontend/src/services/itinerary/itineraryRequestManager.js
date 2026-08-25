const activeTripItineraryRequests =
  new Map()

function getTripItineraryRequestKey(
  userId,
  tripId,
) {
  return `${userId}:${tripId}`
}

export function getOrCreateTripItineraryRequest(
  userId,
  tripId,
  requestFactory,
) {
  const requestKey =
    getTripItineraryRequestKey(
      userId,
      tripId,
    )

  const activeRequest =
    activeTripItineraryRequests.get(
      requestKey,
    )

  if (activeRequest) {
    return activeRequest
  }

  const newRequest =
    requestFactory()

  activeTripItineraryRequests.set(
    requestKey,
    newRequest,
  )

  return newRequest
}

export function releaseTripItineraryRequest(
  userId,
  tripId,
  request,
) {
  const requestKey =
    getTripItineraryRequestKey(
      userId,
      tripId,
    )

  if (
    activeTripItineraryRequests.get(
      requestKey,
    ) === request
  ) {
    activeTripItineraryRequests.delete(
      requestKey,
    )
  }
}