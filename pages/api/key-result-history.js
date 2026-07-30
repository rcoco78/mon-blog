// API route pour récupérer l'historique d'un ou plusieurs Key Results
// Les données sont mises à jour par le cron job et stockées dans Vercel Blob Storage
//
// GET ?keyResultId=xxx&days=30          → array (rétrocompat)
// GET ?keyResultIds=a,b,c&days=30       → { [id]: array }  (évite N+1 client)

import { list } from '@vercel/blob'
import { getKeyResultHistory } from '../../lib/notion'

const HISTORY_PREFIX = 'key-results-history/'

function filterHistoryByDays(history, days) {
  const requestedDays = parseInt(days, 10) || 30
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - requestedDays)
  cutoffDate.setHours(0, 0, 0, 0)

  return history
    .map((item) => {
      let itemDate
      if (item.date) {
        itemDate = new Date(item.date)
      } else if (item.timestamp) {
        itemDate = new Date(item.timestamp)
      } else {
        return null
      }

      if (isNaN(itemDate.getTime())) {
        return null
      }

      return {
        ...item,
        date: item.date || itemDate.toISOString(),
        timestamp: item.timestamp || itemDate.getTime(),
      }
    })
    .filter((item) => {
      if (!item) return false
      const itemDate = new Date(item.date || item.timestamp)
      return itemDate >= cutoffDate
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp).getTime()
      const dateB = new Date(b.date || b.timestamp).getTime()
      return dateA - dateB
    })
}

async function fetchHistoryForId(keyResultId, days) {
  try {
    const filename = `${HISTORY_PREFIX}${keyResultId}.json`
    const blobs = await list({ prefix: filename })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === filename)

    if (existingBlob) {
      const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

      if (response.ok) {
        const data = await response.json()
        if (data.history && Array.isArray(data.history)) {
          const filteredHistory = filterHistoryByDays(data.history, days)
          console.log(
            `✅ Historique récupéré depuis Blob Storage pour ${keyResultId} (${filteredHistory.length}/${data.history.length} entrées sur ${days} jours)`
          )
          return filteredHistory
        }
      }
    }
  } catch (blobError) {
    console.warn(
      `⚠️ Erreur Blob pour ${keyResultId}, fallback Notion:`,
      blobError.message
    )
  }

  console.log(`🔄 Historique Notion (fallback) pour ${keyResultId}`)
  try {
    return await getKeyResultHistory(keyResultId, parseInt(days, 10) || 30)
  } catch (error) {
    const isRateLimit =
      error.message?.includes('rate_limited') ||
      error.message?.includes('429') ||
      error.status === 429 ||
      error.code === 'rate_limited' ||
      error.code === 'rate_limit_exceeded'

    if (isRateLimit) {
      console.warn(`⚠️ Rate limit pour ${keyResultId}, historique vide`)
    } else {
      console.error(`Erreur historique ${keyResultId}:`, error)
    }
    return []
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { keyResultId, keyResultIds, days = 30 } = req.query

  const ids = keyResultIds
    ? String(keyResultIds)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : keyResultId
      ? [String(keyResultId)]
      : []

  if (ids.length === 0) {
    return res.status(400).json({ error: 'keyResultId or keyResultIds is required' })
  }

  try {
    // Batch : une seule réponse map — Fixes CORENTIN-BLOG-6
    if (keyResultIds || ids.length > 1) {
      const entries = await Promise.all(
        ids.map(async (id) => [id, await fetchHistoryForId(id, days)])
      )
      return res.status(200).json(Object.fromEntries(entries))
    }

    const history = await fetchHistoryForId(ids[0], days)
    return res.status(200).json(history)
  } catch (error) {
    console.error('Erreur API key-result-history:', error)
    if (keyResultIds || ids.length > 1) {
      return res.status(200).json(Object.fromEntries(ids.map((id) => [id, []])))
    }
    return res.status(200).json([])
  }
}
