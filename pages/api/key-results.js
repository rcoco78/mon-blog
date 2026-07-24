// API route pour récupérer les Key Results
// Les données sont mises à jour par le cron job et stockées dans Vercel Blob Storage
// Les stats Apify (users / actors) sont enrichies en live depuis le profil public.

import { list } from '@vercel/blob'
import { getKeyResults } from '../../lib/notion'
import { enrichKeyResultsWithApifyLive } from '../../lib/apify-live-stats'
import { enrichKeyResultsWithMarketplaceProof } from '../../lib/project-count'
import { captureDataError } from '../../lib/sentry'

const BLOB_FILENAME = 'key-results.json'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let keyResults = null

    try {
      const blobs = await list({ prefix: BLOB_FILENAME })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

      if (existingBlob) {
        const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

        if (response.ok) {
          const data = await response.json()
          if (data.keyResults && Array.isArray(data.keyResults)) {
            keyResults = data.keyResults
          }
        }
      }
    } catch (blobError) {
      console.warn('⚠️ Erreur Blob key-results, fallback Notion:', blobError.message)
    }

    if (!keyResults) {
      keyResults = await getKeyResults()
    }

    keyResults = enrichKeyResultsWithMarketplaceProof(
      await enrichKeyResultsWithApifyLive(keyResults)
    )
    res.status(200).json(keyResults)
  } catch (error) {
    captureDataError(error, { source: 'notion', tags: { area: 'key-results' } })
    console.error('Erreur API key-results:', error)

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
