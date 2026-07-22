/**
 * Stats live du profil Apify public (source de vérité pour les users uniques).
 * actorsTotalUsers sur apify.com/{username} = utilisateurs uniques tous actors confondus
 * (≠ somme des totalUsers par actor, qui double-compte).
 */

const DEFAULT_USERNAME = process.env.APIFY_PROFILE_USERNAME || 'corent1robert'
const STORE_API = 'https://api.apify.com/v2/store'

let cache = null
let cacheExpiresAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000

function parseActorsTotalUsers(html) {
  if (!html) return null
  const patterns = [
    /actorsTotalUsers\\?":(\d+)/,
    /"actorsTotalUsers"\s*:\s*(\d+)/,
    /actorsTotalUsers["']?\s*[:=]\s*(\d+)/,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) {
      const n = parseInt(m[1], 10)
      if (Number.isFinite(n) && n > 0) return n
    }
  }
  return null
}

async function fetchActorsCount(username) {
  try {
    const params = new URLSearchParams({
      username,
      limit: '1',
      sortBy: 'relevance',
    })
    const res = await fetch(`${STORE_API}?${params}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = await res.json()
    const total = json?.data?.total
    return Number.isFinite(total) && total > 0 ? total : null
  } catch {
    return null
  }
}

/**
 * @param {string} [username]
 * @returns {Promise<{ totalUsers: number|null, actorsCount: number|null, username: string, source: string }>}
 */
async function getApifyProfileStats(username = DEFAULT_USERNAME) {
  if (cache && Date.now() < cacheExpiresAt && cache.username === username) {
    return cache
  }

  let totalUsers = null
  let actorsCount = null

  try {
    const res = await fetch(`https://apify.com/${username}`, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; CorentinRobertBot/1.0; +https://www.corentinrobert.fr)',
      },
    })
    if (res.ok) {
      const html = await res.text()
      totalUsers = parseActorsTotalUsers(html)
    }
  } catch (e) {
    console.warn('[apify-live-stats] profile fetch failed:', e?.message)
  }

  actorsCount = await fetchActorsCount(username)

  // Fallback : somme des users par actor (sous-estime légèrement les uniques du profil)
  if (totalUsers == null) {
    try {
      const { getApifyActors } = require('./apify-actors-api')
      const actors = await getApifyActors(username)
      if (actors?.length) {
        totalUsers = actors.reduce((s, a) => s + (a.stats?.totalUsers || 0), 0)
        if (actorsCount == null) actorsCount = actors.length
      }
    } catch (e) {
      console.warn('[apify-live-stats] store fallback failed:', e?.message)
    }
  }

  const result = {
    totalUsers,
    actorsCount,
    username,
    source: totalUsers != null ? 'apify-profile' : 'unavailable',
  }

  if (totalUsers != null || actorsCount != null) {
    cache = result
    cacheExpiresAt = Date.now() + CACHE_TTL_MS
  }

  return result
}

function isApifyTotalUsersKeyResult(kr) {
  const nameLower = (kr?.name || '').toLowerCase()
  const categoryLower = (kr?.category || '').toLowerCase()
  const isTotal =
    nameLower.includes('utilisateurs total') ||
    nameLower.includes('total users') ||
    nameLower.includes('total utilisateurs') ||
    nameLower === 'utilisateurs' ||
    nameLower === 'total users apify'
  const isApify =
    nameLower.includes('apify') ||
    categoryLower.includes('apify') ||
    categoryLower.includes('scraping')
  const isMonthly = nameLower.includes('mensuel') || nameLower.includes('monthly')
  return isTotal && isApify && !isMonthly
}

function isApifyActorsCountKeyResult(kr) {
  const nameLower = (kr?.name || '').toLowerCase()
  return (
    nameLower.includes('actors publiés') ||
    nameLower.includes('actors publies') ||
    nameLower.includes('scrapers publics') ||
    nameLower.includes('total actors')
  )
}

/**
 * Remplace les currentResult Notion (souvent en retard) par les stats live Apify.
 */
async function enrichKeyResultsWithApifyLive(keyResults) {
  if (!Array.isArray(keyResults) || keyResults.length === 0) return keyResults

  const stats = await getApifyProfileStats()
  if (stats.totalUsers == null && stats.actorsCount == null) return keyResults

  return keyResults.map((kr) => {
    if (stats.totalUsers != null && isApifyTotalUsersKeyResult(kr)) {
      const target = Number(kr.targetResult) || 0
      const current = stats.totalUsers
      const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : kr.progress
      return {
        ...kr,
        currentResult: current,
        progress,
        liveSource: 'apify-profile',
      }
    }
    if (stats.actorsCount != null && isApifyActorsCountKeyResult(kr)) {
      const target = Number(kr.targetResult) || 0
      const current = stats.actorsCount
      const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : kr.progress
      return {
        ...kr,
        currentResult: current,
        progress,
        liveSource: 'apify-profile',
      }
    }
    return kr
  })
}

/**
 * Met à jour les métriques homepage (utilisateurs actifs / scrapers publics).
 */
async function enrichMetricsWithApifyLive(metrics) {
  if (!Array.isArray(metrics) || metrics.length === 0) return metrics

  const stats = await getApifyProfileStats()
  if (stats.totalUsers == null && stats.actorsCount == null) return metrics

  return metrics.map((m) => {
    const label = (m.label || '').toLowerCase()
    if (stats.totalUsers != null && (label.includes('utilisateurs') || label.includes('users'))) {
      return { ...m, value: String(stats.totalUsers), liveSource: 'apify-profile' }
    }
    if (
      stats.actorsCount != null &&
      (label.includes('scrapers publics') || label.includes('actors'))
    ) {
      return { ...m, value: String(stats.actorsCount), liveSource: 'apify-profile' }
    }
    return m
  })
}

module.exports = {
  getApifyProfileStats,
  isApifyTotalUsersKeyResult,
  isApifyActorsCountKeyResult,
  enrichKeyResultsWithApifyLive,
  enrichMetricsWithApifyLive,
}
