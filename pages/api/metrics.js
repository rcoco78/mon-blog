// API route pour récupérer les métriques mises à jour
// Les métriques sont mises à jour par le cron job et stockées dans Vercel Blob Storage
// Users / actors Apify enrichis en live depuis le profil public.

import { list } from '@vercel/blob'
import { siteConfig } from '../../lib/config'
import { enrichMetricsWithApifyLive } from '../../lib/apify-live-stats'
import { captureDataError } from '../../lib/sentry'

const BLOB_FILENAME = 'metrics.json'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    let metrics = siteConfig.metrics
    let lastUpdated = null

    try {
      const blobs = await list({ prefix: BLOB_FILENAME })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

      if (existingBlob) {
        const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

        if (response.ok) {
          const data = await response.json()
          if (data.metrics?.length) {
            metrics = data.metrics
            lastUpdated = data.lastUpdated || null
          }
        }
      }
    } catch (e) {
      console.warn('metrics: blob read failed', e?.message)
    }

    metrics = await enrichMetricsWithApifyLive(metrics)

    return res.status(200).json({
      success: true,
      metrics,
      lastUpdated,
    })
  } catch (error) {
    captureDataError(error, { source: 'blob', tags: { area: 'metrics' } })
    console.error('Erreur lors de la récupération des métriques:', error)

    return res.status(200).json({
      success: true,
      metrics: siteConfig.metrics,
      lastUpdated: null,
      error: 'Using fallback metrics',
    })
  }
}
