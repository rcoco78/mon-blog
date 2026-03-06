/**
 * Historique quotidien des stats Apify (totalUsers par actor)
 * Stocké dans Blob pour calcul du delta vs veille
 */

const { put, list } = require('@vercel/blob')

const BLOB_FILENAME = 'apify-actors-stats-snapshot.json'

/**
 * Charge le dernier snapshot (date + users par slug)
 * @returns {Promise<{ date: string, actors: Record<string, number> }|null>}
 */
async function getLastSnapshot() {
  try {
    const blobs = await list({ prefix: BLOB_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === BLOB_FILENAME)
    if (!blob) return null
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.previous || null
  } catch {
    return null
  }
}

/**
 * Sauvegarde le snapshot du jour (remplace previous)
 * @param {string} date - ISO date YYYY-MM-DD
 * @param {Record<string, number>} actors - slug → totalUsers
 */
async function saveSnapshot(date, actors) {
  const payload = {
    previous: { date, actors },
    updatedAt: new Date().toISOString(),
  }
  await put(BLOB_FILENAME, JSON.stringify(payload, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

module.exports = { getLastSnapshot, saveSnapshot }
