// A single queue for every Places / Details attempt, including retries.
// Monotonic start times enforce at most 5 calls in any rolling second.
const entries = new Map()
const generations = new Map()
const queue = []
const starts = []
let activeCount = 0
let timer = null
let cooldownUntil = 0

export function attractionsAbortError() {
  return new DOMException('Attractions request cancelled.', 'AbortError')
}

export function getAttractionsGeneration(userId) {
  return generations.get(userId) ?? 0
}

export function assertAttractionsCurrent(userId, generation, signal) {
  if (signal?.aborted || generation !== getAttractionsGeneration(userId)) {
    throw attractionsAbortError()
  }
}

function finish(entry, error, value) {
  if (entry.done) return
  entry.done = true
  if (entries.get(entry.key) === entry) entries.delete(entry.key)
  for (const consumer of [...entry.consumers]) consumer.settle(error, value)
}

function pump() {
  clearTimeout(timer)
  timer = null
  while (queue.length && activeCount < 4) {
    const entry = queue[0]
    if (entry.done || entry.controller.signal.aborted) {
      queue.shift()
      continue
    }
    const now = performance.now()
    while (starts.length && now - starts[0] >= 1001) starts.shift()
    const wait = Math.max(
      cooldownUntil - now,
      starts.length >= 5 ? starts[0] + 1001 - now : 0,
    )
    if (wait > 0) {
      timer = setTimeout(pump, Math.ceil(wait))
      return
    }
    queue.shift()
    starts.push(performance.now())
    activeCount += 1
    run(entry)
  }
}

async function run(entry) {
  try {
    const value = await entry.factory(entry.controller.signal)
    if (entry.controller.signal.aborted) throw attractionsAbortError()
    finish(entry, null, value)
  } catch (error) {
    if (error.status === 429 && !entry.controller.signal.aborted && !entry.done) {
      cooldownUntil = Math.max(
        cooldownUntil,
        performance.now() + (error.retryAfterMs ?? 1500),
      )
      if (entry.retries === 0) {
        entry.retries += 1
        queue.push(entry)
      } else {
        finish(entry, error)
      }
    } else {
      finish(entry, error)
    }
  } finally {
    activeCount -= 1
    pump()
  }
}

export function requestAttractions(userId, requestKey, factory, signal) {
  if (!userId || signal?.aborted) return Promise.reject(attractionsAbortError())
  const key = JSON.stringify([userId, requestKey])
  let entry = entries.get(key)
  if (!entry) {
    entry = {
      key, userId, factory, controller: new AbortController(),
      consumers: new Set(), retries: 0, done: false,
    }
    entries.set(key, entry)
    queue.push(entry)
  }
  const promise = new Promise((resolve, reject) => {
    const consumer = {
      settle(error, value) {
        signal?.removeEventListener('abort', onAbort)
        entry.consumers.delete(consumer)
        if (error) reject(error)
        else resolve(value)
      },
    }
    function onAbort() {
      consumer.settle(attractionsAbortError())
      if (!entry.consumers.size && !entry.done) {
        entry.controller.abort()
        finish(entry, attractionsAbortError())
        pump()
      }
    }
    entry.consumers.add(consumer)
    signal?.addEventListener('abort', onAbort, { once: true })
    if (signal?.aborted) onAbort()
  })
  pump()
  return promise
}

export function invalidateUserAttractionsRequests(userId) {
  if (!userId) return
  generations.set(userId, getAttractionsGeneration(userId) + 1)
  for (const entry of [...entries.values()]) {
    if (entry.userId === userId) {
      entry.controller.abort()
      finish(entry, attractionsAbortError())
    }
  }
  // Do not reset starts/cooldown: switching users must not bypass pacing.
  pump()
}
