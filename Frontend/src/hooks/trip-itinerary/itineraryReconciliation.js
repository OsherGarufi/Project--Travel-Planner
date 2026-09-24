export function getScheduleReconciliationKey(
  userId,
  tripId,
  itemId,
) {
  return `${userId}:${tripId}:${itemId}`
}

export function applyScheduleReconciliations(
  reconciliations,
  userId,
  tripId,
  items,
) {
  let didApply = false
  const consumedKeys = []

  const nextItems = items.map(
    (item) => {
      const reconciliationKey =
        getScheduleReconciliationKey(
          userId,
          tripId,
          item.id,
        )

      const reconciledItem =
        reconciliations.get(
          reconciliationKey,
        )

      if (!reconciledItem) {
        return item
      }

      didApply = true
      consumedKeys.push(reconciliationKey)

      return reconciledItem
    },
  )

  return {
    items: nextItems,
    didApply,
    consumedKeys,
  }
}

export function appendItineraryItem(
  items,
  item,
) {
  return [...items, item]
}

export function replaceItineraryItem(
  items,
  itemId,
  nextItem,
) {
  return items.map((item) =>
    item.id === itemId
      ? nextItem
      : item,
  )
}

export function removeItineraryItem(
  items,
  itemId,
) {
  return items.filter(
    (item) => item.id !== itemId,
  )
}
