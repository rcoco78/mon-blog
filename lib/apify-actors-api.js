/**
 * Récupère les actors Apify d'un utilisateur via l'API Store ( publique, pas d'auth )
 * https://docs.apify.com/api/v2/store-get
 */

const STORE_API = 'https://api.apify.com/v2/store'
const DEFAULT_USERNAME = 'corent1robert'

/**
 * Liste tous les actors publics d'un utilisateur
 * @param {string} [username] - Username Apify (défaut: corent1robert)
 * @returns {Promise<Array<{ id, title, name, username, description, url, stats }>>}
 */
async function getApifyActors(username = DEFAULT_USERNAME) {
  const params = new URLSearchParams({
    username,
    limit: '200',
    sortBy: 'relevance',
  })
  const url = `${STORE_API}?${params}`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Apify Store API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  const items = json?.data?.items || []
  const total = json?.data?.total ?? 0

  return items.map((item) => {
    const totalUsers = item.stats?.totalUsers ?? 0
    const totalRuns = item.stats?.totalRuns ?? 0
    const users7d = item.stats?.totalUsers7Days ?? 0
    const users30d = item.stats?.totalUsers30Days ?? 0
    const users90d = item.stats?.totalUsers90Days ?? 0
    const runStats = item.stats?.publicActorRunStats30Days
    const successRate = runStats
      ? Math.round((100 * (runStats.SUCCEEDED || 0)) / Math.max(1, runStats.TOTAL || 0))
      : 0
    // Score priorité : popularité + activité récente + fiabilité (comme marketplace)
    const scorePriorite = totalUsers * 2 + Math.floor(totalRuns / 50) + successRate + users30d * 5

    const pricing = item.currentPricingInfo || {}
    const pricingModel = pricing.pricingModel || 'FREE'
    const priceUsd = pricing.pricePerUnitUsd ?? null

    return {
      id: item.id,
      slug: `${item.username}/${item.name}`,
      title: item.title || item.name,
      name: item.name,
      username: item.username,
      description: item.description || '',
      url: item.url || `https://apify.com/${item.username}/${item.name}`,
      pictureUrl: item.pictureUrl || null,
      stats: {
        totalUsers,
        totalRuns,
        totalUsers30Days: users30d,
        successRate,
        lastRunAt: item.stats?.lastRunStartedAt || null,
        bookmarkCount: item.stats?.bookmarkCount ?? 0,
        reviewCount: item.stats?.actorReviewCount ?? item.actorReviewCount ?? 0,
        reviewRating: item.stats?.actorReviewRating ?? item.actorReviewRating ?? 0,
        runs30d: {
          succeeded: runStats?.SUCCEEDED ?? 0,
          failed: runStats?.FAILED ?? 0,
          aborted: runStats?.ABORTED ?? 0,
          timedOut: runStats?.['TIMED-OUT'] ?? 0,
          total: runStats?.TOTAL ?? 0,
        },
      },
      categories: item.categories || [],
      scorePriorite,
      notice: item.notice || 'NONE',
      pricing: {
        model: pricingModel,
        priceUsd,
        trialMinutes: pricing.trialMinutes ?? null,
      },
    }
  })
}

module.exports = { getApifyActors }
