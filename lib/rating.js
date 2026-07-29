/**
 * Helpers notes Schema.org / Google Review snippets.
 * ratingValue doit être dans [worstRating, bestRating] (défaut 1–5).
 * Attention: Number("5") est OK, mais 0 + "5" concatène en JS → avg faux (ex. 185).
 */

export function parseStarRating(value, { worst = 1, best = 5, fallback = 5 } = {}) {
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(n)) return fallback
  return Math.min(best, Math.max(worst, n))
}

/** ratingValue string pour JSON-LD, toujours dans la plage. */
export function clampRatingValue(value, opts) {
  return String(parseStarRating(value, opts))
}

export function averageStarRating(values, opts) {
  const list = (Array.isArray(values) ? values : []).map((v) => parseStarRating(v, opts))
  if (list.length === 0) return null
  const avg = list.reduce((sum, n) => sum + n, 0) / list.length
  return Number(avg.toFixed(1))
}

export function normalizeAggregateRating(agg, opts = {}) {
  if (!agg || typeof agg !== 'object') return agg
  const best = Number(agg.bestRating) || opts.best || 5
  const worst = Number(agg.worstRating) || opts.worst || 1
  const out = {
    ...agg,
    '@type': 'AggregateRating',
    ratingValue: clampRatingValue(agg.ratingValue, { worst, best, fallback: opts.fallback ?? 5 }),
    bestRating: String(best),
    worstRating: String(worst),
  }
  if (agg.reviewCount != null) out.reviewCount = String(agg.reviewCount)
  return out
}
