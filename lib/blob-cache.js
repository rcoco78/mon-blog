/**
 * Lectures Blob avec cache process court pour éviter les list() redondants
 * pendant un même build / request cycle.
 */
import { list, head } from '@vercel/blob'

const CACHE_TTL_MS = 30_000
const cache = new Map()

/** Vercel Blob peut exposer name, code ou message selon les versions. */
export function isBlobNotFoundError(error) {
  if (!error) return false
  if (error.name === 'BlobNotFoundError' || error.constructor?.name === 'BlobNotFoundError') {
    return true
  }
  if (error.code === 'not_found' || error.status === 404) return true
  return /blob does not exist|not_found/i.test(String(error.message || ''))
}

function cacheKey(kind, key) {
  return `${kind}:${key}`
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

function setCached(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}

/**
 * Liste les blobs pour un préfixe, avec cache court.
 */
export async function listBlobsCached(prefix) {
  const key = cacheKey('list', prefix)
  const cached = getCached(key)
  if (cached !== undefined) return cached

  try {
    const result = await list({ prefix })
    return setCached(key, result)
  } catch (error) {
    console.warn(`blob-cache: list failed for ${prefix}:`, error?.message)
    return setCached(key, { blobs: [] })
  }
}

/**
 * Récupère le premier blob exact (pathname === filename) puis le JSON.
 */
export async function fetchBlobJson(pathname, { revalidate = 300 } = {}) {
  const key = cacheKey('json', pathname)
  const cached = getCached(key)
  if (cached !== undefined) return cached

  try {
    const { blobs } = await listBlobsCached(pathname)
    const blob = blobs.find((b) => b.pathname === pathname)
    if (!blob) {
      return setCached(key, null)
    }
    const res = await fetch(blob.url, { next: { revalidate } })
    if (!res.ok) {
      return setCached(key, null)
    }
    const data = await res.json()
    return setCached(key, data)
  } catch (error) {
    console.warn(`blob-cache: fetchJson failed for ${pathname}:`, error?.message)
    return setCached(key, null)
  }
}

/**
 * Récupère un blob par pathname exact via head(), puis le JSON.
 */
export async function fetchBlobJsonByHead(pathname, { revalidate = 300 } = {}) {
  const key = cacheKey('head-json', pathname)
  const cached = getCached(key)
  if (cached !== undefined) return cached

  try {
    const blob = await head(pathname)
    if (!blob) return setCached(key, null)
    const res = await fetch(blob.url, { next: { revalidate } })
    if (!res.ok) return setCached(key, null)
    const data = await res.json()
    return setCached(key, data)
  } catch (error) {
    if (!isBlobNotFoundError(error)) {
      console.warn(`blob-cache: headJson failed for ${pathname}:`, error?.message)
    }
    return setCached(key, null)
  }
}

/**
 * Exécute une promesse avec timeout (fallback si dépassé).
 */
export async function withTimeout(promise, ms, fallbackValue) {
  let timeoutId
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallbackValue), ms)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
