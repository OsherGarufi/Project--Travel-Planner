export const ITINERARY_CATEGORIES = [
  {
    name: 'Flights',
    key: 'flights',
  },
  {
    name: 'Accommodation',
    key: 'accommodation',
  },
  {
    name: 'Food',
    key: 'food',
  },
  {
    name: 'Transportation',
    key: 'transportation',
  },
  {
    name: 'Activities',
    key: 'activities',
  },
  {
    name: 'Shopping',
    key: 'shopping',
  },
  {
    name: 'Insurance',
    key: 'insurance',
  },
  {
    name: 'Other',
    key: 'other',
  },
]

export const ITINERARY_DAYS_PER_WEEK = 7

export const ITINERARY_START_HOUR = 8

export const ITINERARY_HOURS_PER_DAY = 24

export const ITINERARY_HOUR_HEIGHT = 64

export const ITINERARY_SNAP_MINUTES = 15

export const ITINERARY_DEFAULT_DURATION_MINUTES = 60

export function getItineraryCategoryKey(
  category,
) {
  if (!category) {
    return 'other'
  }

  const normalizedCategory =
    category.trim().toLowerCase()

  const matchingCategory =
    ITINERARY_CATEGORIES.find(
      (item) =>
        item.name.toLowerCase() ===
        normalizedCategory,
    )

  return matchingCategory?.key ?? 'other'
}