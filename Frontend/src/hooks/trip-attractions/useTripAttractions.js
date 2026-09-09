import { useEffect, useRef, useState } from 'react'
import { searchCities } from '../../services/city/cityService'
import {
  ATTRACTIONS_PAGE_SIZE, getAttractionDetails, getCachedAttractionDetails,
  hasAttractionsConfiguration, mergeAttractionDetails, searchAttractions,
} from '../../services/attractions/attractionsService'
import { getAttractionsGeneration } from '../../services/attractions/attractionsRequestManager'

const normalizeName = (value) => value.trim().toLowerCase().replace(/\s+/g, ' ')

export function useTripAttractions(trip, userId) {
  const [filters, setFilters] = useState({ category: 'All', radius: 10000 })
  const [state, setState] = useState({
    items: [], status: 'idle', error: '', moreError: '', hasMore: false,
    loadingMore: false, searchedFilters: null,
  })
  const operation = useRef(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      operation.current?.controller.abort()
    }
  }, [])

  const configured = hasAttractionsConfiguration()
  const isCurrent = (op) => mounted.current && operation.current === op &&
    !op.controller.signal.aborted && op.generation === getAttractionsGeneration(userId)

  const update = (op, change) => {
    if (isCurrent(op)) setState((previous) => ({ ...previous, ...change }))
  }

  const publishItems = (op) => update(op, { items: [...op.items.values()] })

  const enrich = async (op, items) => {
    for (let index = 0; index < items.length && isCurrent(op); index += 4) {
      await Promise.allSettled(items.slice(index, index + 4).map(async (item) => {
        try {
          const details = await getAttractionDetails(userId, item.placeId, op.controller.signal)
          if (!isCurrent(op)) return
          op.items.set(item.placeId, mergeAttractionDetails(op.items.get(item.placeId), details))
        } catch (error) {
          if (!isCurrent(op) || error.name === 'AbortError') return
          op.items.set(item.placeId, {
            ...op.items.get(item.placeId), detailsLoading: false, detailsError: true,
          })
        }
        publishItems(op)
      }))
    }
  }

  const loadPage = async (op, offset) => {
    const page = await searchAttractions(userId, { ...op.search, offset }, op.controller.signal)
    if (!isCurrent(op)) return
    const uncached = []
    for (const item of page.items) {
      if (op.items.has(item.placeId)) continue
      const cached = getCachedAttractionDetails(userId, item.placeId)
      op.items.set(item.placeId, cached
        ? mergeAttractionDetails(item, cached)
        : { ...item, detailsLoading: true })
      if (!cached) uncached.push(item)
    }
    op.nextOffset = offset + ATTRACTIONS_PAGE_SIZE
    op.hasMore = page.rawCount === ATTRACTIONS_PAGE_SIZE
    update(op, {
      items: [...op.items.values()], status: 'ready', error: '',
      moreError: '', hasMore: op.hasMore, searchedFilters: op.filters,
    })
    // Base cards are published before asynchronous enrichment begins.
    // Pages share this chain so Show more never restarts existing enrichment.
    op.enrichment = op.enrichment.then(() => enrich(op, uncached))
  }

  const search = async () => {
    if (!configured || !userId) return
    const identity = JSON.stringify(filters)
    if (operation.current?.busy && operation.current.identity === identity) return
    operation.current?.controller.abort()
    const op = {
      controller: new AbortController(), generation: getAttractionsGeneration(userId),
      identity, filters: { ...filters }, items: new Map(), busy: true,
      nextOffset: 0, enrichment: Promise.resolve(), hasMore: false,
    }
    operation.current = op
    update(op, {
      items: [], status: 'resolving', error: '', moreError: '',
      hasMore: false, loadingMore: false, searchedFilters: null,
    })
    try {
      if (!trip.destinationCountryCode || !trip.destinationCity) {
        throw new Error('This trip needs a destination city and country to explore attractions.')
      }
      const cities = await searchCities(
        trip.destinationCountryCode, trip.destinationCity, op.controller.signal,
      )
      if (!isCurrent(op)) return
      const matches = cities.filter((city) =>
        typeof city.name === 'string' &&
        normalizeName(city.name) === normalizeName(trip.destinationCity) &&
        city.countryCode?.toUpperCase() === trip.destinationCountryCode.toUpperCase())
      const unique = [...new Map(matches.map((city) =>
        [`${city.id}:${city.latitude}:${city.longitude}`, city])).values()]
      if (unique.length !== 1) {
        throw new Error(unique.length > 1
          ? 'Several cities match this destination. Attractions cannot choose a location safely.'
          : 'Could not locate this destination city. Please try again later.')
      }
      const city = unique[0]
      if (!Number.isFinite(city.latitude) || Math.abs(city.latitude) > 90 ||
          !Number.isFinite(city.longitude) || Math.abs(city.longitude) > 180) {
        throw new Error('Coordinates are unavailable for this destination.')
      }
      op.search = { ...op.filters, latitude: city.latitude, longitude: city.longitude }
      update(op, { status: 'loading' })
      await loadPage(op, 0)
    } catch (error) {
      if (error.name !== 'AbortError') update(op, { status: 'error', error: error.message })
    } finally {
      op.busy = false
    }
  }

  const showMore = async () => {
    const op = operation.current
    if (!op || !isCurrent(op) || op.busy || !op.hasMore) return
    op.busy = true
    update(op, { loadingMore: true, moreError: '' })
    try { await loadPage(op, op.nextOffset) } catch (error) {
      if (error.name !== 'AbortError') update(op, { moreError: error.message })
    } finally {
      op.busy = false
      update(op, { loadingMore: false })
    }
  }

  return { ...state, filters, setFilters, search, showMore, configured }
}
