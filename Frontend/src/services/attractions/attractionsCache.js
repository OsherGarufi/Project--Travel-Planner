const PREFIX = 'travelPlanner:attractions:'
const TTL_MS = 24 * 60 * 60 * 1000
const memory = new Map()

function keyFor(userId, kind, key) {
  return `${PREFIX}${encodeURIComponent(userId)}:${kind}:${encodeURIComponent(key)}`
}

function remove(key) {
  memory.delete(key)
  try { localStorage.removeItem(key) } catch { /* Best-effort cache. */ }
}

function valid(entry, kind) {
  if (!entry || !Number.isFinite(entry.cachedAt) ||
      entry.cachedAt > Date.now() || Date.now() - entry.cachedAt >= TTL_MS) return false
  if (kind === 'search') {
    return Array.isArray(entry.data?.items) &&
      Number.isInteger(entry.data.rawCount) &&
      entry.data.items.every((item) => typeof item.placeId === 'string' && typeof item.name === 'string')
  }
  return entry.data && typeof entry.data === 'object' &&
    !Array.isArray(entry.data) && typeof entry.data.placeId === 'string'
}

export function readAttractionsCache(userId, kind, key) {
  if (!userId) return null
  const storageKey = keyFor(userId, kind, key)
  try {
    const entry = memory.get(storageKey) ??
      JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (!valid(entry, kind)) {
      remove(storageKey)
      return null
    }
    // Keep the original timestamp; hydration must not renew the TTL.
    memory.set(storageKey, entry)
    return entry.data
  } catch {
    remove(storageKey)
    return null
  }
}

export function writeAttractionsCache(userId, kind, key, data) {
  if (!userId) return
  const entry = { data, cachedAt: Date.now() }
  if (!valid(entry, kind)) return
  const storageKey = keyFor(userId, kind, key)
  memory.set(storageKey, entry)
  try { localStorage.setItem(storageKey, JSON.stringify(entry)) } catch { /* Memory still works. */ }
}

export function clearUserAttractionsCache(userId) {
  if (!userId) return
  const prefix = `${PREFIX}${encodeURIComponent(userId)}:`
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key)
  }
  try {
    Object.keys(localStorage).filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key))
  } catch { /* Cleanup must not block sign out. */ }
}
