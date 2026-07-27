import { apiRequest } from '../apiClient'
import {
    validateCitiesResponse,
} from './cityValidation'

function createAbortError() {
  return new DOMException(
    'The request was aborted.',
    'AbortError',
  )
}

export function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw createAbortError()
  }
}

export function createSharedCityRequest(
  requestsMap,
  requestKey,
  endpoint,
  onSuccess,
) {
  const controller = new AbortController()

  const requestEntry = {
    controller,
    consumerCount: 0,
    completed: false,
    promise: null,
  }

  requestEntry.promise = apiRequest(
    endpoint,
    {
      signal: controller.signal,
    },
  )
    .then(validateCitiesResponse)
    .then((cities) => {
      onSuccess(cities)

      return cities
    })
    .finally(() => {
      requestEntry.completed = true

      if (
        requestsMap.get(requestKey) === requestEntry
      ) {
        requestsMap.delete(requestKey)
      }
    })

  requestsMap.set(requestKey, requestEntry)

  return requestEntry
}

export function subscribeToSharedCityRequest(
  requestsMap,
  requestKey,
  requestEntry,
  signal,
) {
  throwIfAborted(signal)

  requestEntry.consumerCount += 1

  return new Promise((resolve, reject) => {
    let isSettled = false

    function cleanup() {
      if (isSettled) {
        return false
      }

      isSettled = true

      signal?.removeEventListener(
        'abort',
        handleAbort,
      )

      requestEntry.consumerCount -= 1

      if (
        requestEntry.consumerCount === 0 &&
        !requestEntry.completed
      ) {
        if (
          requestsMap.get(requestKey) ===
          requestEntry
        ) {
          requestsMap.delete(requestKey)
        }

        requestEntry.controller.abort()
      }

      return true
    }

    function handleAbort() {
      if (!cleanup()) {
        return
      }

      reject(createAbortError())
    }

    signal?.addEventListener(
      'abort',
      handleAbort,
      {
        once: true,
      },
    )

    if (signal?.aborted) {
      handleAbort()

      return
    }

    requestEntry.promise.then(
      (cities) => {
        if (!cleanup()) {
          return
        }

        resolve(cities)
      },
      (error) => {
        if (!cleanup()) {
          return
        }

        reject(error)
      },
    )
  })
}