/**
 * Classement « Les plus vues » du marketplace.
 *
 * Source : PostHog EU, projet 251458, événement `$pageview`,
 * propriété `$pathname` au format `/marketplace/{catégorie}/{slug}`.
 * Fenêtre : 28 jours. Bots exclus (`$virt_is_bot`).
 * Seuil : au moins 2 vues, 6 fiches max.
 * Égalité : slug alphabétique.
 *
 * Le blob `marketplace-top-views.json` est la copie servie en prod.
 * `data/marketplace-top-views.json` est le dernier classement connu,
 * utilisé si le blob est absent. Une liste vide n'affiche pas de faux top.
 */

import topViewsSnapshot from '../data/marketplace-top-views.json'

export const MARKETPLACE_TOP_VIEWS_BLOB = 'marketplace-top-views.json'
export const MARKETPLACE_TOP_VIEWS_WINDOW_DAYS = 28
export const MARKETPLACE_TOP_VIEWS_LIMIT = 6
export const MARKETPLACE_TOP_VIEWS_MIN_VIEWS = 2
export const POSTHOG_PROJECT_ID = '251458'

const PATH_RE = /^\/marketplace\/([^/]+)\/([^/]+)$/

export function slugFromMarketplacePath(pathname) {
  const match = String(pathname || '').match(PATH_RE)
  if (!match) return null
  return { category: match[1], slug: match[2] }
}

export function rankMarketplacePathViews(rows = []) {
  const bySlug = new Map()
  for (const row of rows) {
    const parsed = slugFromMarketplacePath(row?.pathname)
    const views = Number(row?.views) || 0
    if (!parsed || views < MARKETPLACE_TOP_VIEWS_MIN_VIEWS) continue
    const prev = bySlug.get(parsed.slug)
    if (!prev || views > prev.views) {
      bySlug.set(parsed.slug, { ...parsed, views })
    }
  }
  return [...bySlug.values()]
    .sort((a, b) => b.views - a.views || a.slug.localeCompare(b.slug))
    .slice(0, MARKETPLACE_TOP_VIEWS_LIMIT)
}

export function normalizeTopViewsPayload(data) {
  const items = Array.isArray(data?.items) ? data.items : []
  return items
    .map((item) => ({
      slug: String(item?.slug || ''),
      category: item?.category ? String(item.category) : null,
      views: Number(item?.views) || 0,
    }))
    .filter((item) => item.slug && item.views >= MARKETPLACE_TOP_VIEWS_MIN_VIEWS)
    .sort((a, b) => b.views - a.views || a.slug.localeCompare(b.slug))
    .slice(0, MARKETPLACE_TOP_VIEWS_LIMIT)
}

export async function loadMarketplaceTopViews() {
  try {
    const { fetchBlobJson } = await import('./blob-cache')
    const blob = await fetchBlobJson(MARKETPLACE_TOP_VIEWS_BLOB)
    const fromBlob = normalizeTopViewsPayload(blob)
    if (fromBlob.length > 0) return fromBlob
  } catch (error) {
    console.warn('[marketplace-top-views] blob:', error?.message)
  }
  return normalizeTopViewsPayload(topViewsSnapshot)
}
