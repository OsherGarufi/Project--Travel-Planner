import { auth } from '../../config/firebase'
import {
  syncExpensesCacheFromItineraryItem,
} from './itineraryExpenseCacheSync'
import {
  getTripItineraryCache,
  setTripItineraryCache,
} from './itineraryCache'
import {
  updateTripItinerarySchedule,
} from './itineraryService'

const ITINERARY_SCHEDULE_SAVE_DELAY_MS =
  5000

const pendingScheduleUpdates =
  new Map()

const scheduleSaveListeners =
  new Set()

function getScheduleUpdateKey(
  userId,
  tripId,
  itemId,
) {
  return `${userId}:${tripId}:${itemId}`
}

function notifyScheduleSaveListeners(
  result,
) {
  for (
    const listener
    of scheduleSaveListeners
  ) {
    listener(result)
  }
}

function applyScheduleItemToCache(
  scheduleEntry,
  item,
  previousItem,
) {
  const cachedItems =
    getTripItineraryCache(
      scheduleEntry.userId,
      scheduleEntry.tripId,
    )

  if (!cachedItems) {
    return
  }

  const hasItem =
    cachedItems.some(
      (cachedItem) =>
        cachedItem.id === item.id,
    )

  if (!hasItem) {
    return
  }

  const nextItems =
    cachedItems.map(
      (cachedItem) =>
        cachedItem.id === item.id
          ? item
          : cachedItem,
    )

  setTripItineraryCache(
    scheduleEntry.userId,
    scheduleEntry.tripId,
    nextItems,
  )

  syncExpensesCacheFromItineraryItem(
    scheduleEntry.userId,
    scheduleEntry.tripId,
    item,
    previousItem,
  )
}

function cancelScheduleEntry(
  scheduleKey,
  scheduleEntry,
  shouldAbortRequest = false,
) {
  if (scheduleEntry.timerId) {
    window.clearTimeout(
      scheduleEntry.timerId,
    )

    scheduleEntry.timerId = null
  }

  scheduleEntry.cancelled = true

  if (shouldAbortRequest) {
    scheduleEntry.abortController
      ?.abort()
  }

  if (
    pendingScheduleUpdates.get(
      scheduleKey,
    ) === scheduleEntry
  ) {
    pendingScheduleUpdates.delete(
      scheduleKey,
    )
  }
}

async function persistQueuedScheduleUpdate(
  scheduleKey,
  expectedVersion,
) {
  const scheduleEntry =
    pendingScheduleUpdates.get(
      scheduleKey,
    )

  if (
    !scheduleEntry ||
    scheduleEntry.cancelled ||
    scheduleEntry.version !==
      expectedVersion
  ) {
    return
  }

  scheduleEntry.timerId = null

  if (scheduleEntry.requestPromise) {
    scheduleEntry.isDue = true

    return
  }

  scheduleEntry.isDue = false

  const currentFirebaseUser =
    auth.currentUser

  if (
    !currentFirebaseUser ||
    currentFirebaseUser.uid !==
      scheduleEntry.userId
  ) {
    cancelScheduleEntry(
      scheduleKey,
      scheduleEntry,
    )

    return
  }

  let currentIdToken

  try {
    currentIdToken =
      await currentFirebaseUser
        .getIdToken()
  } catch (error) {
    const latestEntry =
      pendingScheduleUpdates.get(
        scheduleKey,
      )

    if (
      latestEntry !==
        scheduleEntry ||
      scheduleEntry.cancelled
    ) {
      return
    }

    if (
      auth.currentUser?.uid !==
      scheduleEntry.userId
    ) {
      cancelScheduleEntry(
        scheduleKey,
        scheduleEntry,
      )

      return
    }

    console.error(
      'Failed to get a current token for the itinerary schedule save:',
      error,
    )

    pendingScheduleUpdates.delete(
      scheduleKey,
    )

    applyScheduleItemToCache(
      scheduleEntry,
      scheduleEntry.confirmedItem,
      scheduleEntry.optimisticItem,
    )

    notifyScheduleSaveListeners({
      status: 'failed',
      userId:
        scheduleEntry.userId,
      tripId:
        scheduleEntry.tripId,
      item:
        scheduleEntry.confirmedItem,
    })

    return
  }

  const latestEntry =
    pendingScheduleUpdates.get(
      scheduleKey,
    )

  if (
    latestEntry !== scheduleEntry ||
    scheduleEntry.cancelled ||
    scheduleEntry.version !==
      expectedVersion
  ) {
    return
  }

  if (
    auth.currentUser?.uid !==
    scheduleEntry.userId
  ) {
    cancelScheduleEntry(
      scheduleKey,
      scheduleEntry,
    )

    return
  }

  const requestVersion =
    scheduleEntry.version

  const requestSchedule = {
    itineraryDate:
      scheduleEntry
        .optimisticItem
        .itineraryDate,

    startTime:
      scheduleEntry
        .optimisticItem
        .startTime,

    endTime:
      scheduleEntry
        .optimisticItem
        .endTime,
  }

  const abortController =
    new AbortController()

  const requestPromise =
    updateTripItinerarySchedule(
      scheduleEntry.tripId,
      scheduleEntry.itemId,
      requestSchedule,
      currentIdToken,
      abortController.signal,
    )

  scheduleEntry.abortController =
    abortController

  scheduleEntry.requestPromise =
    requestPromise

  try {
    const updatedItem =
      await requestPromise

    if (!updatedItem?.id) {
      throw new Error(
        'Invalid itinerary schedule response.',
      )
    }

    const currentEntry =
      pendingScheduleUpdates.get(
        scheduleKey,
      )

    if (
      !currentEntry ||
      currentEntry.cancelled
    ) {
      return
    }

    currentEntry.requestPromise =
      null

    currentEntry.abortController =
      null

    currentEntry.confirmedItem =
      updatedItem

    if (
      currentEntry.version !==
      requestVersion
    ) {
      if (currentEntry.isDue) {
        currentEntry.isDue = false

        window.setTimeout(
          () =>
            persistQueuedScheduleUpdate(
              scheduleKey,
              currentEntry.version,
            ),
          0,
        )
      }

      return
    }

    pendingScheduleUpdates.delete(
      scheduleKey,
    )

    applyScheduleItemToCache(
      currentEntry,
      updatedItem,
      currentEntry.optimisticItem,
    )

    notifyScheduleSaveListeners({
      status: 'saved',
      userId:
        currentEntry.userId,
      tripId:
        currentEntry.tripId,
      item: updatedItem,
    })
  } catch (error) {
    const currentEntry =
      pendingScheduleUpdates.get(
        scheduleKey,
      )

    if (
      !currentEntry ||
      currentEntry.cancelled
    ) {
      return
    }

    currentEntry.requestPromise =
      null

    currentEntry.abortController =
      null

    if (
      currentEntry.version !==
      requestVersion
    ) {
      if (currentEntry.isDue) {
        currentEntry.isDue = false

        window.setTimeout(
          () =>
            persistQueuedScheduleUpdate(
              scheduleKey,
              currentEntry.version,
            ),
          0,
        )
      }

      return
    }

    console.error(
      'Failed to save dragged itinerary schedule:',
      error,
    )

    pendingScheduleUpdates.delete(
      scheduleKey,
    )

    const rollbackItem =
      currentEntry.confirmedItem

    applyScheduleItemToCache(
      currentEntry,
      rollbackItem,
      currentEntry.optimisticItem,
    )

    notifyScheduleSaveListeners({
      status: 'failed',
      userId:
        currentEntry.userId,
      tripId:
        currentEntry.tripId,
      item: rollbackItem,
    })
  }
}

export function queueItineraryScheduleSave({
  userId,
  tripId,
  itemId,
  confirmedItem,
  optimisticItem,
}) {
  const scheduleKey =
    getScheduleUpdateKey(
      userId,
      tripId,
      itemId,
    )

  const existingEntry =
    pendingScheduleUpdates.get(
      scheduleKey,
    )

  if (existingEntry?.timerId) {
    window.clearTimeout(
      existingEntry.timerId,
    )
  }

  const nextVersion =
    (existingEntry?.version ?? 0) +
    1

  const scheduleEntry = {
    userId,
    tripId,
    itemId,
    version: nextVersion,

    confirmedItem:
      existingEntry
        ?.confirmedItem ??
      confirmedItem,

    optimisticItem,

    requestPromise:
      existingEntry
        ?.requestPromise ??
      null,

    abortController:
      existingEntry
        ?.abortController ??
      null,

    timerId: null,
    isDue: false,
    cancelled: false,
  }

  scheduleEntry.timerId =
    window.setTimeout(
      () =>
        persistQueuedScheduleUpdate(
          scheduleKey,
          nextVersion,
        ),
      ITINERARY_SCHEDULE_SAVE_DELAY_MS,
    )

  pendingScheduleUpdates.set(
    scheduleKey,
    scheduleEntry,
  )
}

export async function supersedeItineraryScheduleSave(
  userId,
  tripId,
  itemId,
) {
  const scheduleKey =
    getScheduleUpdateKey(
      userId,
      tripId,
      itemId,
    )

  const scheduleEntry =
    pendingScheduleUpdates.get(
      scheduleKey,
    )

  if (!scheduleEntry) {
    return
  }

  cancelScheduleEntry(
    scheduleKey,
    scheduleEntry,
  )

  if (scheduleEntry.requestPromise) {
    try {
      await scheduleEntry
        .requestPromise
    } catch {
      // The next explicit mutation
      // will become the source of truth.
    }
  }
}

export function invalidateUserItineraryScheduleSaves(
  userId,
) {
  if (!userId) {
    return
  }

  for (
    const [
      scheduleKey,
      scheduleEntry,
    ]
    of pendingScheduleUpdates
  ) {
    if (
      scheduleEntry.userId !==
      userId
    ) {
      continue
    }

    cancelScheduleEntry(
      scheduleKey,
      scheduleEntry,
      true,
    )
  }
}

export function subscribeToItineraryScheduleSaves(
  listener,
) {
  scheduleSaveListeners.add(
    listener,
  )

  return () => {
    scheduleSaveListeners.delete(
      listener,
    )
  }
}
