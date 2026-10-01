/**
 * Cron quotidien : recopier le top PostHog des fiches marketplace dans le blob.
 * Sans POSTHOG_PERSONAL_API_KEY, ne touche pas au classement déjà publié.
 */

import { syncMarketplaceTopViews } from '../../../lib/sync-marketplace-top-views'

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const hasValidSecret = process.env.CRON_SECRET
    ? req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
    : false

  if (!isVercelCron && !hasValidSecret) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const result = await syncMarketplaceTopViews()
    return res.status(200).json(result)
  } catch (error) {
    console.error('[marketplace-top-views]', error?.message)
    return res.status(500).json({ error: error?.message || 'sync failed' })
  }
}
