import {
  assertAttractionsCurrent, getAttractionsGeneration, requestAttractions,
} from './attractionsRequestManager'

const option = (label, categories) => ({ value: 'recommended:' + label, label, categories })
export const RECOMMENDED_GROUPS = [
  { ...option('Food & Nightlife', ['catering.restaurant', 'catering.cafe', 'catering.bar', 'catering.pub']), children: [
    option('Restaurants', ['catering.restaurant']),
    option('Cafes', ['catering.cafe']),
    option('Bars & Pubs', ['catering.bar', 'catering.pub']),
  ] },
  { ...option('Tourism & Sights', ['tourism.sights', 'tourism.attraction.viewpoint', 'entertainment.museum', 'entertainment.culture.gallery']), children: [
    option('Historic Sites & Landmarks', ['tourism.sights']),
    option('Museums & Galleries', ['entertainment.museum', 'entertainment.culture.gallery']),
    option('Viewpoints', ['tourism.attraction.viewpoint']),
  ] },
  { ...option('Nature & Parks', ['leisure.park', 'beach', 'leisure.park.nature_reserve', 'natural.protected_area', 'national_park']), children: [
    option('Urban Parks & Gardens', ['leisure.park', 'leisure.park.garden']),
    option('Beaches', ['beach']),
    option('Nature Reserves & Hiking Trails', ['leisure.park.nature_reserve', 'natural.protected_area', 'national_park', 'highway.path']),
  ] },
  { ...option('Entertainment & Leisure', ['entertainment.activity_park', 'entertainment.theme_park', 'entertainment.water_park', 'entertainment.zoo', 'entertainment.aquarium', 'entertainment.culture.theatre', 'entertainment.culture.arts_centre']), children: [
    option('Amusement & Water Parks', ['entertainment.activity_park', 'entertainment.theme_park', 'entertainment.water_park']),
    option('Zoos & Aquariums', ['entertainment.zoo', 'entertainment.aquarium']),
    option('Theatres & Show Venues', ['entertainment.culture.theatre', 'entertainment.culture.arts_centre']),
  ] },
  { ...option('Shopping', ['commercial.shopping_mall', 'commercial.marketplace']), children: [
    option('Shopping Malls', ['commercial.shopping_mall']),
    option('Markets & Street Markets', ['commercial.marketplace']),
  ] },
]
export const RECOMMENDED_OPTIONS = RECOMMENDED_GROUPS.flatMap((group) => [
  group, ...group.children.map((child) => ({ ...child, child: true })),
])
export const DEFAULT_CATEGORY = RECOMMENDED_OPTIONS[0].value
const CACHE_KEY = 'travelPlanner:attractions:categoryCatalog:v2'
const TTL = 7 * 24 * 60 * 60 * 1000
let memory = null
let hydrated = false
const EMPTY_CATALOG = []
const optionsByCatalog = new WeakMap()
const collator = new Intl.Collator(undefined, { sensitivity: 'base' })

function validCategories(categories) {
  return Array.isArray(categories) && categories.length > 0 &&
    categories.every((value) => typeof value === 'string' && /^[a-z][a-z0-9_-]*(\.[a-z0-9_-]+)*$/.test(value))
}

function clearInvalidCatalog() {
  memory = null
  try { localStorage.removeItem(CACHE_KEY) } catch { /* Storage is optional. */ }
}

export function readCategoryCatalog() {
  if (!hydrated) {
    hydrated = true
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored !== null) {
        memory = JSON.parse(stored)
        if (!memory) clearInvalidCatalog()
      }
    } catch { clearInvalidCatalog() }
  }
  if (!memory) return EMPTY_CATALOG
  if (!Number.isFinite(memory.cachedAt) || memory.cachedAt > Date.now() ||
      Date.now() - memory.cachedAt >= TTL || !validCategories(memory.categories)) {
    clearInvalidCatalog()
    return EMPTY_CATALOG
  }
  // Hydration keeps the original timestamp. Options are built once per validated catalog.
  catalogOptions(memory.categories)
  return memory.categories
}

function titleCase(part) {
  return part.replaceAll('_', ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

export function friendlyCategory(identifier) {
  const parts = identifier.split('.')
  const leaf = titleCase(parts.at(-1))
  return parts.length > 1 ? leaf + ' (' + titleCase(parts.at(-2)) + ')' : leaf
}

export function catalogOptions(categories) {
  if (optionsByCatalog.has(categories)) return optionsByCatalog.get(categories)
  if (!validCategories(categories)) return EMPTY_CATALOG
  const items = [...new Set(categories)]
    .map((identifier) => ({
      value: 'catalog:' + identifier, label: friendlyCategory(identifier), categories: [identifier],
    }))
    // Only omit a standalone option represented identically in Recommended.
    // A group containing the identifier is not a substitute for selecting it alone.
    .filter((item) => !RECOMMENDED_OPTIONS.some((recommended) =>
      recommended.categories.length === 1 && recommended.categories[0] === item.categories[0] &&
      collator.compare(recommended.label, item.label) === 0))
  const labels = new Map()
  for (const item of items) {
    const key = item.label.toLocaleLowerCase()
    labels.set(key, (labels.get(key) ?? 0) + 1)
  }
  const usedLabels = new Set(RECOMMENDED_OPTIONS.map((item) => item.label.toLocaleLowerCase()))
  const uniqueValues = new Map()
  for (const item of items) {
    const parts = item.categories[0].split('.')
    if (labels.get(item.label.toLocaleLowerCase()) > 1 || usedLabels.has(item.label.toLocaleLowerCase())) {
      const peers = items.filter((other) => other !== item &&
        friendlyCategory(other.categories[0]).toLocaleLowerCase() === item.label.toLocaleLowerCase())
      const ancestor = parts.slice(0, -2).reverse().find((part) =>
        peers.every((other) => !other.categories[0].split('.').slice(0, -2).includes(part)))
      if (ancestor) {
        item.label = titleCase(parts.at(-1)) + ' (' + titleCase(parts.at(-2)) + ', ' + titleCase(ancestor) + ')'
      }
    }
    const label = item.label
    let suffix = 2
    while (usedLabels.has(item.label.toLocaleLowerCase())) item.label = label + ' (' + suffix++ + ')'
    usedLabels.add(item.label.toLocaleLowerCase())
    uniqueValues.set(item.value, item)
  }
  const options = [...uniqueValues.values()].sort((a, b) => collator.compare(a.label, b.label))
  optionsByCatalog.set(categories, options)
  return options
}

export function resolveCategory(value) {
  return RECOMMENDED_OPTIONS.find((item) => item.value === value) ??
    catalogOptions(readCategoryCatalog()).find((item) => item.value === value) ?? null
}

export async function loadCategoryCatalog(userId, signal) {
  const generation = getAttractionsGeneration(userId)
  assertAttractionsCurrent(userId, generation, signal)
  const cached = readCategoryCatalog()
  if (cached.length) return cached
  const categories = await requestAttractions(userId, 'category-catalog:v1', async (requestSignal) => {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim()
    if (!apiKey) throw new Error('Full category catalog is unavailable.')
    let response
    try {
      response = await fetch('https://api.geoapify.com/v1/mcp?' + new URLSearchParams({ apiKey }), {
        method: 'POST', signal: requestSignal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'tools/call',
          params: { name: 'list_place_categories', arguments: {} },
        }),
      })
    } catch {
      if (requestSignal.aborted) throw new DOMException('Cancelled.', 'AbortError')
      throw new Error('Full category catalog is unavailable.')
    }
    if (!response.ok) {
      const error = new Error('Full category catalog is unavailable.')
      error.status = response.status
      const header = response.headers.get('Retry-After')
      const delay = header == null ? NaN : Number.isFinite(Number(header))
        ? Number(header) * 1000 : Date.parse(header) - Date.now()
      if (Number.isFinite(delay)) error.retryAfterMs = Math.max(0, delay)
      throw error
    }
    let payload
    try {
      const body = await response.text()
      if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
        payload = body.split(/\r?\n\r?\n/).map((event) => event.split(/\r?\n/)
          .filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n'))
          .filter(Boolean).map((data) => JSON.parse(data)).find((message) => message.id === 1)
      } else payload = JSON.parse(body)
      if (payload?.error || payload?.result?.isError) throw new Error()
      let data = payload?.result?.structuredContent
      if (!data) {
        const content = payload?.result?.content?.find((item) => item.type === 'text')
        data = JSON.parse(content?.text ?? 'null')
      }
      if (!validCategories(data?.categories)) throw new Error()
      return [...new Set(data.categories)]
    } catch { throw new Error('Full category catalog is unavailable.') }
  }, signal)
  assertAttractionsCurrent(userId, generation, signal)
  hydrated = true
  memory = { cachedAt: Date.now(), categories }
  catalogOptions(categories)
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(memory)) } catch { /* Memory remains usable. */ }
  return categories
}
