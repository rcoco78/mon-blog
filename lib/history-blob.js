/**
 * Historiques quotidiens synchronisés par le cron key-results-sync dans Vercel Blob :
 * - key-results.json
 * - key-results-history/{keyResultId}.json
 *
 * Les pages /objectifs lisaient seulement les bases Notion brutes (sans pagination → max 100 lignes).
 * On préfère le Blob quand il est à jour, avec repli sur Notion corrigé.
 */

import { list } from '@vercel/blob'

const KEY_RESULTS_BLOB = 'key-results.json'
const HISTORY_PREFIX = 'key-results-history/'

async function findBlobByPathname(pathname) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null
  try {
    const out = await list({ prefix: pathname })
    return out.blobs?.find((b) => b.pathname === pathname) || null
  } catch {
    return null
  }
}

async function fetchBlobJson(pathname) {
  const meta = await findBlobByPathname(pathname)
  if (!meta?.url) return null
  const res = await fetch(meta.url, { cache: 'no-store' })
  if (!res.ok) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

function findAbonnesKrId(keyResults) {
  if (!Array.isArray(keyResults)) return null
  const kr = keyResults.find((k) => {
    const nameLower = (k.name || '').toLowerCase()
    const categoryLower = (k.category || '').toLowerCase()
    return (
      (nameLower.includes('abonnés') || nameLower.includes('abonne')) &&
      (categoryLower.includes('logement') || categoryLower.includes('entrepreneurial'))
    )
  })
  return kr?.id || null
}

function findApifyUsersKrId(keyResults) {
  if (!Array.isArray(keyResults)) return null
  let kr = keyResults.find((k) => {
    const nameLower = (k.name || '').toLowerCase()
    const categoryLower = (k.category || '').toLowerCase()
    return (
      (nameLower.includes('utilisateurs total') || nameLower.includes('total users')) &&
      (categoryLower.includes('apify') || categoryLower.includes('scraping'))
    )
  })
  if (!kr) {
    const matching = keyResults.filter((k) => {
      const nameLower = (k.name || '').toLowerCase()
      const categoryLower = (k.category || '').toLowerCase()
      return (
        (nameLower.includes('utilisateur') || nameLower.includes('user')) &&
        (categoryLower.includes('apify') || categoryLower.includes('scraping'))
      )
    })
    if (matching.length > 0) {
      kr = matching.reduce((max, k) => ((k.targetResult || 0) > (max.targetResult || 0) ? k : max))
    }
  }
  return kr?.id || null
}

function normalizeBlobHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .map((h) => {
      const n = Number(h.valeur)
      const dateStr = h.date != null ? String(h.date) : ''
      return {
        id: h.id,
        date: dateStr,
        valeur: Number.isFinite(n) ? n : 0
      }
    })
    .filter((h) => h.date && Number.isFinite(h.valeur))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function lastEntryTime(arr) {
  if (!arr.length) return 0
  const t = new Date(arr[arr.length - 1].date).getTime()
  return Number.isFinite(t) ? t : 0
}

async function loadHistoryFromBlobForKrId(krId) {
  if (!krId) return []
  const data = await fetchBlobJson(`${HISTORY_PREFIX}${krId}.json`)
  return normalizeBlobHistory(data?.history)
}

/**
 * Choisit l’historique le plus récent entre Blob (cron) et Notion.
 */
function pickNewerHistory(blobArr, notionArr) {
  const b = lastEntryTime(blobArr)
  const n = lastEntryTime(notionArr)
  if (blobArr.length > 0 && notionArr.length > 0) {
    return b >= n ? blobArr : notionArr
  }
  if (blobArr.length > 0) return blobArr
  return notionArr
}

export async function resolveAbonnesHistoryWithBlob(getNotionHistory) {
  const keyData = await fetchBlobJson(KEY_RESULTS_BLOB)
  const krId = findAbonnesKrId(keyData?.keyResults)
  const fromBlob = await loadHistoryFromBlobForKrId(krId)
  const fromNotion = await getNotionHistory()
  return pickNewerHistory(fromBlob, fromNotion)
}

export async function resolveApifyUsersHistoryWithBlob(getNotionHistory) {
  const keyData = await fetchBlobJson(KEY_RESULTS_BLOB)
  const krId = findApifyUsersKrId(keyData?.keyResults)
  const fromBlob = await loadHistoryFromBlobForKrId(krId)
  const fromNotion = await getNotionHistory()
  return pickNewerHistory(fromBlob, fromNotion)
}
