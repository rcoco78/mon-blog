/**
 * Chargement du mapping vidéo Tella → bases marketplace
 * Données stockées dans Blob : marketplace-database-videos.json
 */

import { list } from '@vercel/blob'

const MAPPING_BLOB_KEY = 'marketplace-database-videos.json'

/** Slugs à exclure : pas d'auto-association vidéo (match erroné ou base sans vidéo dédiée) */
export const EXCLUDED_SLUGS = new Set(['restaurants-tripadvisor-uk-base-donnees'])

/**
 * URL d'embed Tella (même logique que la fiche produit).
 * @param {string|null|undefined} videoUrl
 * @param {{ muted?: boolean }} [opts] - muted=true pour autoplay muet éventuel
 * @returns {string|null}
 */
export function toEmbedVideoUrl(videoUrl, { muted = false } = {}) {
  if (!videoUrl) return null
  const muteFlag = muted ? '1' : '0'
  if (videoUrl.includes('/embed')) {
    if (muted && !/[?&]muted=/.test(videoUrl)) {
      return `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}muted=1`
    }
    if (muted) return videoUrl.replace(/muted=\d/, 'muted=1')
    return videoUrl
  }
  const tellaMatch = videoUrl.match(/tella\.tv\/video\/([^\/\?]+)/)
  if (tellaMatch) {
    return `https://www.tella.tv/video/${tellaMatch[1]}/embed?b=1&title=1&a=1&loop=0&t=0&muted=${muteFlag}&wt=0`
  }
  return `${videoUrl}/embed?b=1&title=1&a=1&loop=0&t=0&muted=${muteFlag}&wt=0`
}

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
    if (EXCLUDED_SLUGS.has(slug)) return null
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
    const mapping = data.mapping || {}
    if (EXCLUDED_SLUGS.size === 0) return mapping
    return Object.fromEntries(Object.entries(mapping).filter(([s]) => !EXCLUDED_SLUGS.has(s)))
  } catch {
    return {}
  }
}
