/**
 * Charge le mapping slug → { priceId, productId } pour les optional_items Stripe.
 * - En prod : Blob (stripe-price-ids.json, écrit par le cron)
 * - En dev : fichier local ou Blob si token configuré
 */

import path from 'path'
import fs from 'fs'

const BLOB_FILENAME = 'stripe-price-ids.json'
const LOCAL_PATH = path.join(process.cwd(), 'data', 'stripe-price-ids.json')

let cached = null

export async function getStripePriceIds() {
  if (cached) return cached

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob')
      const blobs = await list({ prefix: BLOB_FILENAME })
      const blob = blobs.blobs.find((b) => b.pathname === BLOB_FILENAME)
      if (blob) {
        const res = await fetch(blob.url, { next: { revalidate: 300 } })
        if (res.ok) {
          cached = await res.json()
          return cached
        }
      }
    } catch (e) {
      console.warn('[stripe-price-ids] Blob inaccessible:', e.message)
    }
  }

  try {
    if (fs && fs.existsSync(LOCAL_PATH)) {
      const raw = fs.readFileSync(LOCAL_PATH, 'utf8')
      cached = JSON.parse(raw)
      return cached
    }
  } catch (e) {
    console.warn('[stripe-price-ids] Fichier local inaccessible:', e.message)
  }

  cached = {}
  return cached
}

/** Map priceId → slug pour retrouver les bases achetées depuis les line_items */
export async function getPriceIdToSlug() {
  const mapping = await getStripePriceIds()
  const reverse = {}
  for (const [slug, data] of Object.entries(mapping)) {
    if (data?.priceId) reverse[data.priceId] = slug
  }
  return reverse
}
