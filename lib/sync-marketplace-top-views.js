/**
 * Recalcule le top des fiches marketplace depuis PostHog et l'écrit dans le blob.
 * Nécessite POSTHOG_PERSONAL_API_KEY (clé personnelle, lecture) et BLOB_READ_WRITE_TOKEN.
 */

import { put } from '@vercel/blob'
import {
  MARKETPLACE_TOP_VIEWS_BLOB,
  MARKETPLACE_TOP_VIEWS_WINDOW_DAYS,
  POSTHOG_PROJECT_ID,
  rankMarketplacePathViews,
} from './marketplace-top-views'

const HOGQL = `
SELECT properties.$pathname AS pathname, count() AS views
FROM events
WHERE event = '$pageview'
  AND timestamp >= now() - INTERVAL ${MARKETPLACE_TOP_VIEWS_WINDOW_DAYS} DAY
  AND match(properties.$pathname, '^/marketplace/[^/]+/[^/]+$')
  AND (properties.$virt_is_bot IS NULL OR properties.$virt_is_bot = false)
GROUP BY pathname
ORDER BY views DESC
LIMIT 40
`

export async function syncMarketplaceTopViews() {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) {
    return { skipped: true, reason: 'POSTHOG_PERSONAL_API_KEY absent' }
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { skipped: true, reason: 'BLOB_READ_WRITE_TOKEN absent' }
  }

  const host = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com'
  const response = await fetch(`${host}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: HOGQL } }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`PostHog query ${response.status}: ${detail.slice(0, 200)}`)
  }

  const payload = await response.json()
  const columns = payload.columns || []
  const pathIndex = columns.indexOf('pathname')
  const viewsIndex = columns.indexOf('views')
  const rows = (payload.results || []).map((row) => ({
    pathname: pathIndex >= 0 ? row[pathIndex] : row[0],
    views: viewsIndex >= 0 ? row[viewsIndex] : row[1],
  }))
  const items = rankMarketplacePathViews(rows)
  const document = {
    source: 'posthog',
    projectId: POSTHOG_PROJECT_ID,
    event: '$pageview',
    property: '$pathname',
    windowDays: MARKETPLACE_TOP_VIEWS_WINDOW_DAYS,
    botsExcluded: true,
    minViews: 2,
    generatedAt: new Date().toISOString(),
    items,
  }

  await put(MARKETPLACE_TOP_VIEWS_BLOB, JSON.stringify(document, null, 2), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json',
  })

  return { skipped: false, count: items.length, items }
}
