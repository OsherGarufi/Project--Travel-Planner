import { useEffect, useRef, useState } from 'react'
import { searchCities } from '../../services/city/cityService'
import {
  ATTRACTIONS_PAGE_SIZE, getAttractionDetails, getCachedAttractionDetails,
  hasAttractionsConfiguration, mergeAttractionDetails, searchAttractions,
} from '../../services/attractions/attractionsService'
import { DEFAULT_CATEGORY, resolveCategory } from '../../services/attractions/attractionCategories'
import { getAttractionsGeneration } from '../../services/attractions/attractionsRequestManager'

const normalizeName = (value) => value.trim().toLowerCase().replace(/\s+/g, ' ')
const initialState = {
  items: [], loadedCount: 0, status: 'idle', error: '', moreError: '',
  currentPage: 1, perPage: 9, revealedCount: 3,
  canLoadMore: false, canNext: false, busy: false, searchedFilters: null,
}

export function useTripAttractions(trip, userId) {
  const [filters, setFilters] = useState({ category: DEFAULT_CATEGORY, radius: 10000 })
  const [state, setState] = useState(initialState)
  const operation = useRef(null)
  const presentation = useRef({ currentPage: 1, perPage: 9, revealedCount: 3 })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      operation.current?.controller.abort()
      operation.current?.view?.abort()
    }
  }, [])

  const configured = hasAttractionsConfiguration()
  const isCurrent = (op) => mounted.current && operation.current === op &&
    !op.controller.signal.aborted && op.generation === getAttractionsGeneration(userId)
  const update = (op, change) => {
    if (isCurrent(op)) setState((previous) => ({ ...previous, ...change }))
  }
  const publish = (op, change = {}) => {
    const { currentPage, perPage, revealedCount } = presentation.current
    const pool = [...op.items.values()]
    const start = (currentPage - 1) * perPage
    update(op, {
      ...presentation.current, items: pool.slice(start, start + revealedCount),
      loadedCount: pool.length, busy: op.busy,
      canLoadMore: revealedCount < perPage && (start + revealedCount < pool.length || op.hasMore),
      canNext: revealedCount >= perPage && (start + perPage < pool.length || op.hasMore), ...change,
    })
  }
  const cancelView = (op) => {
    op.view?.abort()
    for (const [id, item] of op.items) {
      if (item.detailsLoading) op.items.set(id, { ...item, detailsLoading: false })
    }
  }
  const viewCurrent = (op, view) => isCurrent(op) && op.view === view && !view.signal.aborted

  // Only a reveal action calls this function, with at most three newly visible cards.
  const enrich = async (op, view, newlyVisible) => {
    const uncached = []
    for (const item of newlyVisible) {
      const current = op.items.get(item.placeId)
      const cached = getCachedAttractionDetails(userId, item.placeId)
      if (cached) op.items.set(item.placeId, mergeAttractionDetails(current, cached))
      else if (!current.detailsLoaded && !op.failedDetails.has(item.placeId)) {
        op.items.set(item.placeId, { ...current, detailsLoading: true })
        uncached.push(item)
      }
    }
    publish(op)
    await Promise.allSettled(uncached.map(async (item) => {
      try {
        const details = await getAttractionDetails(userId, item.placeId, view.signal)
        if (!viewCurrent(op, view)) return
        op.items.set(item.placeId, mergeAttractionDetails(op.items.get(item.placeId), details))
      } catch (error) {
        if (!viewCurrent(op, view) || error.name === 'AbortError') return
        op.failedDetails.add(item.placeId)
        op.items.set(item.placeId, {
          ...op.items.get(item.placeId), detailsLoading: false, detailsError: true,
        })
      }
      publish(op)
    }))
  }
  const fetchPool = async (op, signal) => {
    const page = await searchAttractions(userId, { ...op.search, offset: op.nextOffset }, signal)
    if (!isCurrent(op) || signal.aborted) return
    for (const item of page.items) {
      if (!op.items.has(item.placeId)) op.items.set(item.placeId, item)
    }
    op.nextOffset += page.rawCount
    op.hasMore = page.rawCount === ATTRACTIONS_PAGE_SIZE
  }

  // A view has its own cancellation token. It never invalidates the authenticated user.
  const reveal = async (op, page, count, allowProvider, reset) => {
    cancelView(op)
    const view = new AbortController()
    op.view = view
    op.busy = true
    publish(op, { moreError: '' })
    const start = (page - 1) * presentation.current.perPage
    const previousCount = reset ? 0 : presentation.current.revealedCount
    try {
      // Demand is only the requested reveal, never the capacity of the UI page.
      // Deliberately one batch maximum, including when normalization removes results.
      if (allowProvider && start + count > op.items.size && op.hasMore) {
        await fetchPool(op, view.signal)
      }
      if (!viewCurrent(op, view)) return
      if (start >= op.items.size && page > 1) {
        publish(op, { moreError: 'No additional named attractions in this batch. Try Next again if more results are available.' })
        return
      }
      const available = Math.max(0, Math.min(count, op.items.size - start))
      presentation.current = { ...presentation.current, currentPage: page, revealedCount: available }
      const newlyVisible = [...op.items.values()].slice(start + previousCount, start + available)
      await enrich(op, view, newlyVisible)
    } catch (error) {
      if (viewCurrent(op, view) && error.name !== 'AbortError') {
        publish(op, { moreError: error.message })
      }
    } finally {
      if (viewCurrent(op, view)) {
        op.busy = false
        publish(op)
      }
    }
  }

  const search = async () => {
    if (!configured || !userId || !resolveCategory(filters.category) || operation.current?.searching) return
    operation.current?.controller.abort()
    operation.current?.view?.abort()
    const op = {
      controller: new AbortController(), generation: getAttractionsGeneration(userId),
      filters: { ...filters }, items: new Map(), failedDetails: new Set(),
      searching: true, busy: true, nextOffset: 0, hasMore: false, view: null,
    }
    operation.current = op
    presentation.current = { ...presentation.current, currentPage: 1, revealedCount: 3 }
    update(op, { ...initialState, ...presentation.current, status: 'resolving', busy: true })
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
      await fetchPool(op, op.controller.signal)
      if (!isCurrent(op)) return
      op.searching = false
      publish(op, { status: 'ready', searchedFilters: {
        ...op.filters, label: resolveCategory(op.filters.category)?.label ?? '',
      } })
      await reveal(op, 1, 3, false, true)
    } catch (error) {
      if (error.name !== 'AbortError') update(op, { status: 'error', error: error.message })
    } finally {
      op.searching = false
      if (isCurrent(op) && !op.view) { op.busy = false; publish(op) }
    }
  }

  const loadMore = () => {
    const op = operation.current
    const { currentPage, perPage, revealedCount } = presentation.current
    if (!op || !isCurrent(op) || op.busy || revealedCount >= perPage) return
    return reveal(op, currentPage, Math.min(perPage, revealedCount + 3), true, false)
  }
  const changePage = (page) => {
    const op = operation.current
    if (!op || !isCurrent(op) || op.busy || !Number.isInteger(page) || page < 1 ||
        Math.abs(page - presentation.current.currentPage) !== 1 ||
        (page > presentation.current.currentPage && presentation.current.revealedCount < presentation.current.perPage)) return
    return reveal(op, page, 3, true, true)
  }
  const changePerPage = (perPage) => {
    if (![3, 6, 9].includes(perPage) || perPage === presentation.current.perPage) return
    presentation.current = { currentPage: 1, perPage, revealedCount: 3 }
    const op = operation.current
    setState((previous) => ({ ...previous, ...presentation.current }))
    if (op && isCurrent(op) && !op.searching) return reveal(op, 1, 3, false, true)
  }

  return { ...state, filters, setFilters, search, loadMore, changePage, changePerPage, configured }
}