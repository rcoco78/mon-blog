/**
 * Lecture des avis marketplace depuis Blob (côté serveur)
 * Fallback local : data/marketplace-reviews.json si Blob indisponible (dev)
 */
import { list } from '@vercel/blob'
import path from 'path'
import fs from 'fs'

const BLOB_FILENAME = 'marketplace-reviews.json'
const LOCAL_FALLBACK = path.join(process.cwd(), 'data', 'marketplace-reviews.json')

function normalizeReviews(arr) {
  return (Array.isArray(arr) ? arr : [])
    .filter((r) => r.visible !== false)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getMarketplaceReviews() {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blobs = await list({ prefix: BLOB_FILENAME })
      const blob = blobs.blobs.find((b) => b.pathname === BLOB_FILENAME)
      if (blob) {
        const res = await fetch(blob.url, { next: { revalidate: 300 } })
        if (res.ok) {
          const data = await res.json()
          return normalizeReviews(data)
        }
      }
    }
  } catch (err) {
    console.warn('[marketplace-reviews] Erreur lecture Blob:', err?.message)
  }
  if (!process.env.VERCEL && fs?.existsSync?.(LOCAL_FALLBACK)) {
    try {
      const data = JSON.parse(fs.readFileSync(LOCAL_FALLBACK, 'utf8'))
      return normalizeReviews(data)
    } catch {}
  }
  return []
}
