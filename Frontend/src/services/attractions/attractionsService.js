import { readAttractionsCache, writeAttractionsCache } from './attractionsCache'
import {
  assertAttractionsCurrent, getAttractionsGeneration, requestAttractions,
} from './attractionsRequestManager'

const GROUPS = {
  Sights: ['tourism.sights', 'tourism.attraction'],
  Museums: ['entertainment.museum'],
  Nature: ['natural', 'national_park', 'leisure.park', 'leisure.park.nature_reserve'],
  Family: ['entertainment.activity_park', 'entertainment.theme_park',
    'entertainment.water_park', 'entertainment.zoo', 'entertainment.aquarium', 'leisure.playground'],
  Extreme: ['entertainment.activity_park.climbing', 'entertainment.flying_fox', 'sport.dive_centre', 'ski'],
}
export const ATTRACTION_CATEGORIES = ['All', ...Object.keys(GROUPS)]
export const ATTRACTIONS_PAGE_SIZE = 20
const LANGUAGE = 'en'

export function hasAttractionsConfiguration() {
  return Boolean(import.meta.env.VITE_GEOAPIFY_API_KEY?.trim())
}

export function safeAttractionUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value.trim())
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.href : ''
  } catch { return '' }
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function categoryFor(categories = []) {
  if (!Array.isArray(categories)) return ''
  // Match the specific Extreme subcategory before its broader Family parent.
  return ['Extreme', 'Museums', 'Nature', 'Family', 'Sights'].find((group) =>
    GROUPS[group].some((prefix) => categories.some((category) =>
      category === prefix || category.startsWith(prefix + '.')))) ?? ''
}

function richFields(properties) {
  const raw = properties.datasource?.raw ?? {}
  return {
    imageUrl: safeAttractionUrl(properties.wiki_and_media?.image) ||
      safeAttractionUrl(properties.image) || safeAttractionUrl(raw.image),
    description: text(properties.description) || text(raw.description),
    website: safeAttractionUrl(properties.website) ||
      safeAttractionUrl(properties.contact?.website) ||
      safeAttractionUrl(raw.website) || safeAttractionUrl(raw['contact:website']),
  }
}

export function normalizeAttraction(feature) {
  const p = feature?.properties ?? {}
  const point = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates : []
  const latitude = p.lat ?? point?.[1]
  const longitude = p.lon ?? point?.[0]
  const placeId = text(p.place_id)
  const name = text(p.name)
  if (!placeId || !name) return null
  return {
    placeId, name,
    category: categoryFor(p.categories),
    address: text(p.address_line2) || text(p.formatted),
    city: text(p.city), country: text(p.country),
    latitude: Number.isFinite(latitude) && Math.abs(latitude) <= 90 ? latitude : null,
    longitude: Number.isFinite(longitude) && Math.abs(longitude) <= 180 ? longitude : null,
    providerDistance: Number.isFinite(p.distance) && p.distance >= 0 ? p.distance : null,
    ...richFields(p),
    detailsLoaded: false, detailsLoading: false,
  }
}

function searchParameters({ latitude, longitude, radius = 10000, category = 'All', offset = 0 }) {
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      ![10000, 25000, 50000].includes(radius) ||
      !ATTRACTION_CATEGORIES.includes(category) || !Number.isInteger(offset) || offset < 0) {
    throw new Error('Choose a valid destination and search area.')
  }
  const categories = category === 'All' ? [...new Set(Object.values(GROUPS).flat())] : GROUPS[category]
  return new URLSearchParams({
    categories: [...categories].sort().join(','),
    filter: `circle:${longitude},${latitude},${radius}`,
    bias: `proximity:${longitude},${latitude}`,
    limit: String(ATTRACTIONS_PAGE_SIZE), offset: String(offset), lang: LANGUAGE,
  })
}

async function providerRequest(endpoint, parameters, signal) {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim()
  if (!apiKey) throw new Error('Attractions is not configured. Set VITE_GEOAPIFY_API_KEY to enable search.')
  const query = new URLSearchParams(parameters)
  query.set('apiKey', apiKey)
  let response
  try {
    response = await fetch(`https://api.geoapify.com/v2/${endpoint}?${query}`, { signal })
  } catch {
    if (signal.aborted) throw new DOMException('Request cancelled.', 'AbortError')
    throw new Error('Could not reach the attractions provider. Please try again.')
  }
  if (!response.ok) {
    const error = new Error(response.status === 429
      ? 'Attractions is busy. Please wait a moment and try again.'
      : 'Could not load attractions. Please try again.')
    error.status = response.status
    if (response.status === 429) {
      const header = response.headers.get('Retry-After')
      const seconds = header == null ? NaN : Number(header)
      const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now()
      if (Number.isFinite(delay)) error.retryAfterMs = Math.max(0, delay)
    }
    throw error
  }
  let data
  try { data = await response.json() } catch { throw new Error('The attractions response was invalid.') }
  if (!Array.isArray(data?.features)) throw new Error('The attractions response was invalid.')
  return data.features
}

async function cachedRequest(userId, kind, key, factory, signal) {
  const generation = getAttractionsGeneration(userId)
  assertAttractionsCurrent(userId, generation, signal)
  if (!userId) throw new Error('Sign in to explore attractions.')
  const cached = readAttractionsCache(userId, kind, key)
  if (cached !== null) return cached
  const data = await requestAttractions(userId, `${kind}:${key}`, factory, signal)
  assertAttractionsCurrent(userId, generation, signal)
  writeAttractionsCache(userId, kind, key, data)
  return data
}

export function searchAttractions(userId, options, signal) {
  const parameters = searchParameters(options)
  return cachedRequest(userId, 'search', parameters.toString(), async (requestSignal) => {
    const features = await providerRequest('places', parameters, requestSignal)
    const items = [...new Map(features.map(normalizeAttraction)
      .filter(Boolean).map((item) => [item.placeId, item])).values()]
    // Pagination follows the provider page, not filtered/deduplicated card count.
    return { items, rawCount: features.length }
  }, signal)
}

export function getCachedAttractionDetails(userId, placeId) {
  return readAttractionsCache(userId, 'details', `${placeId}:${LANGUAGE}`)
}

export function getAttractionDetails(userId, placeId, signal) {
  return cachedRequest(userId, 'details', `${placeId}:${LANGUAGE}`, async (requestSignal) => {
    const features = await providerRequest('place-details', new URLSearchParams({
      id: placeId, features: 'details', lang: LANGUAGE,
    }), requestSignal)
    const properties = features.find((feature) =>
      feature.properties?.feature_type === 'details')?.properties
    if (!properties) throw new Error('Details are unavailable for this attraction.')
    return { placeId, ...richFields(properties) }
  }, signal)
}

export function mergeAttractionDetails(attraction, details) {
  return {
    ...attraction,
    imageUrl: details.imageUrl || attraction.imageUrl,
    description: details.description || attraction.description,
    website: details.website || attraction.website,
    detailsLoading: false, detailsLoaded: true, detailsError: false,
  }
}
