import { getApifyUsersHistory } from '../../lib/notion'
import { resolveApifyUsersHistoryWithBlob } from '../../lib/history-blob'
import { getApifyProfileStats } from '../../lib/apify-live-stats'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let history = await resolveApifyUsersHistoryWithBlob(getApifyUsersHistory)
    if (!Array.isArray(history)) history = []

    // Pointe le jour courant sur le total live (profil Apify), pas le cache Notion
    try {
      const stats = await getApifyProfileStats()
      if (stats.totalUsers != null) {
        const today = new Date().toISOString().slice(0, 10)
        const withoutToday = history.filter((h) => h.date !== today && !String(h.id || '').startsWith('kr-apify-users-'))
        history = [
          ...withoutToday,
          {
            id: `apify-live-${today}`,
            date: today,
            valeur: stats.totalUsers,
            liveSource: 'apify-profile',
          },
        ].sort((a, b) => String(a.date).localeCompare(String(b.date)))
      }
    } catch (e) {
      console.warn('apify-users-history: live enrich failed', e?.message)
    }

    res.status(200).json(history)
  } catch (error) {
    console.error('Erreur API apify-users-history:', error)

    const isRateLimit =
      error.message?.includes('rate_limited') ||
      error.message?.includes('429') ||
      error.status === 429 ||
      error.code === 'rate_limited' ||
      error.code === 'rate_limit_exceeded'

    if (isRateLimit) {
      return res.status(200).json([])
    }

    return res.status(200).json([])
  }
}
