/**
 * Chargement du mapping vidéo Tella → bases marketplace
 * Données stockées dans Blob : marketplace-database-videos.json
 */

import { list } from '@vercel/blob'

const MAPPING_BLOB_KEY = 'marketplace-database-videos.json'

/**
 * Récupère l'URL d'embed vidéo pour une base marketplace (slug)
 * @param {string} slug - Slug de la base de données
 * @returns {Promise<string|null>}
 */
export async function getVideoUrlForDatabase(slug) {
  if (typeof window !== 'undefined' || !slug) return null

  try {
    const blobs = await list({ prefix: MAPPING_BLOB_KEY })
    const blob = blobs.blobs.find((b) => b.pathname === MAPPING_BLOB_KEY)
    if (!blob) return null

    const res = await fetch(blob.url, { next: { revalidate: 300 } })
    if (!res.ok) return null

    const data = await res.json()
    return data.mapping?.[slug] || null
  } catch {
    return null
  }
}

/**
 * Récupère tout le mapping (pour usage batch)
 * @returns {Promise<Record<string, string>>}
 */
export async function getMarketplaceVideoMapping() {
  if (typeof window !== 'undefined') return {}

  try {
    const blobs = await list({ prefix: MAPPING_BLOB_KEY })
    const blob = blobs.blobs.find((b) => b.pathname === MAPPING_BLOB_KEY)
    if (!blob) return {}

    const res = await fetch(blob.url, { next: { revalidate: 300 } })
    if (!res.ok) return {}

    const data = await res.json()
    return data.mapping || {}
  } catch {
    return {}
  }
}
