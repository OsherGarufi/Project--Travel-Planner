const activeTripsRequests = new Map()
const activeTripDetailsRequests =
  new Map()
const activeTripExpensesRequests =
  new Map()

function getTripDetailsRequestKey(
  userId,
  tripId,
) {
  return `${userId}:${tripId}`
}

function getTripExpensesRequestKey(
  userId,
  tripId,
) {
  return `${userId}:${tripId}`
}

export function getOrCreateTripsRequest(
  userId,
  requestFactory,
) {
  const activeRequest =
    activeTripsRequests.get(userId)

  if (activeRequest) {
    return activeRequest
  }

  const newRequest =
    requestFactory()

  activeTripsRequests.set(
    userId,
    newRequest,
  )

  return newRequest
}

export function releaseTripsRequest(
  userId,
  request,
) {
  if (
    activeTripsRequests.get(
      userId,
    ) === request
  ) {
    activeTripsRequests.delete(
      userId,
    )
  }
}

export function getOrCreateTripDetailsRequest(
  userId,
  tripId,
  requestFactory,
) {
  const requestKey =
    getTripDetailsRequestKey(
      userId,
      tripId,
    )

  const activeRequest =
    activeTripDetailsRequests.get(
      requestKey,
    )

  if (activeRequest) {
    return activeRequest
  }

  const newRequest =
    requestFactory()

  activeTripDetailsRequests.set(
    requestKey,
    newRequest,
  )

  return newRequest
}

export function releaseTripDetailsRequest(
  userId,
  tripId,
  request,
) {
  const requestKey =
    getTripDetailsRequestKey(
      userId,
      tripId,
    )

  if (
    activeTripDetailsRequests.get(
      requestKey,
    ) === request
  ) {
    activeTripDetailsRequests.delete(
      requestKey,
    )
  }
}

export function getOrCreateTripExpensesRequest(
  userId,
  tripId,
  requestFactory,
) {
  const requestKey =
    getTripExpensesRequestKey(
      userId,
      tripId,
    )

  const activeRequest =
    activeTripExpensesRequests.get(
      requestKey,
    )

  if (activeRequest) {
    return activeRequest
  }

  const newRequest =
    requestFactory()

  activeTripExpensesRequests.set(
    requestKey,
    newRequest,
  )

  return newRequest
}

export function releaseTripExpensesRequest(
  userId,
  tripId,
  request,
) {
  const requestKey =
    getTripExpensesRequestKey(
      userId,
      tripId,
    )

  if (
    activeTripExpensesRequests.get(
      requestKey,
    ) === request
  ) {
    activeTripExpensesRequests.delete(
      requestKey,
    )
  }
}