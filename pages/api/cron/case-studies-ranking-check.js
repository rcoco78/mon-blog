/**
 * Cron hebdomadaire : feedback loop SEO sur les cas d'usage générés
 *
 * Vérifie les positions Search Console des pages /cas-usage/ créées récemment
 * et envoie un rapport Telegram pour identifier :
 * - Les pages qui rankent bien (pos 1-10) → succès
 * - Les pages qui progressent (pos 11-30) → potentiel
 * - Les pages qui stagnent (pos 30+) → à améliorer
 * - Les pages sans impression (0 imp) → probablement pas indexées
 *
 * Schedule : 1x/semaine (dimanche 8h)
 * Variables : CRON_SECRET, GOOGLE_SERVICE_ACCOUNT_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, BLOB_READ_WRITE_TOKEN
 */

import { list } from '@vercel/blob'
import { google } from 'googleapis'
import fs from 'fs/promises'
import path from 'path'
import { siteConfig } from '../../../lib/config'
import { sectorToSlug } from '../../../lib/case-studies-helpers'

const BLOB_FILENAME = 'case-studies.json'
const DAYS_TO_CHECK = 60 // Pages créées dans les 60 derniers jours
const SITE_URL = 'sc-domain:corentinrobert.fr'
const BASE_URL = siteConfig?.url || 'https://www.corentinrobert.fr'

async function getAuth() {
  let serviceAccount = null
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    } catch { return null }
  } else {
    const keyPath = path.join(process.cwd(), 'service-account-key.json')
    try {
      await fs.access(keyPath)
      serviceAccount = JSON.parse(await fs.readFile(keyPath, 'utf8'))
    } catch { return null }
  }
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  return auth.getClient()
}

async function sendTelegram(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) return
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true }),
  }).catch(() => {})
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (process.env.CRON_SECRET) {
    const auth = req.headers.authorization
    if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  try {
    // 1) Charger les cas d'usage générés récemment depuis le blob
    const blobs = await list({ prefix: BLOB_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === BLOB_FILENAME)
    if (!blob) {
      return res.status(200).json({ ok: true, message: 'Blob non trouvé' })
    }

    const blobRes = await fetch(blob.url, { cache: 'no-store' })
    const blobData = await blobRes.json()
    const allCases = blobData.caseStudies || []

    // Filtrer les cas générés automatiquement dans les DAYS_TO_CHECK derniers jours
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - DAYS_TO_CHECK)
    const recentCases = allCases.filter((cs) => {
      if (!cs.generated || !cs.createdAt) return false
      return new Date(cs.createdAt) > cutoff
    })

    console.log(`[ranking-check] ${recentCases.length} cas générés dans les ${DAYS_TO_CHECK} derniers jours`)

    if (recentCases.length === 0) {
      return res.status(200).json({ ok: true, message: 'Aucun cas récent à vérifier' })
    }

    // 2) Récupérer les positions Search Console pour ces pages
    const authClient = await getAuth()
    if (!authClient) {
      console.warn('[ranking-check] Pas de credentials Search Console')
      return res.status(200).json({ ok: true, message: 'Search Console non configuré' })
    }

    const client = google.searchconsole({ version: 'v1', auth: authClient })
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 28) // 4 dernières semaines

    // Construire les URLs des pages à vérifier
    const pageUrls = recentCases.map((cs) => {
      const sectorSlug = sectorToSlug ? sectorToSlug(cs.sector) : (cs.sector || '').toLowerCase().replace(/\s+/g, '-')
      return `${BASE_URL}/cas-usage/${sectorSlug}/${cs.slug}`
    })

    // Récupérer les données SC pour toutes les pages
    let pageRows = []
    try {
      const { data } = await client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
          dimensions: ['page'],
          rowLimit: 5000,
        },
      })
      pageRows = data?.rows || []
    } catch (e) {
      console.warn('[ranking-check] Erreur Search Console:', e.message)
    }

    // Indexer par URL
    const scByUrl = {}
    for (const row of pageRows) {
      const url = row.keys?.[0] || ''
      scByUrl[url] = {
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        position: row.position || 0,
        ctr: (row.ctr || 0) * 100,
      }
    }

    // 3) Analyser chaque page
    const results = recentCases.map((cs) => {
      const sectorSlug = sectorToSlug ? sectorToSlug(cs.sector) : (cs.sector || '').toLowerCase().replace(/\s+/g, '-')
      const url = `${BASE_URL}/cas-usage/${sectorSlug}/${cs.slug}`
      const sc = scByUrl[url] || { impressions: 0, clicks: 0, position: 0 }
      const agedays = Math.floor((Date.now() - new Date(cs.createdAt).getTime()) / (1000 * 60 * 60 * 24))

      let status
      if (sc.impressions === 0) {
        status = agedays > 14 ? 'not_indexed' : 'too_recent'
      } else if (sc.position > 0 && sc.position <= 10) {
        status = 'ranking_well'
      } else if (sc.position > 10 && sc.position <= 30) {
        status = 'progressing'
      } else {
        status = 'stagnating'
      }

      return { cs, url, sc, agedays, status }
    })

    // 4) Construire le rapport Telegram
    const rankingWell = results.filter((r) => r.status === 'ranking_well')
    const progressing = results.filter((r) => r.status === 'progressing')
    const stagnating = results.filter((r) => r.status === 'stagnating')
    const notIndexed = results.filter((r) => r.status === 'not_indexed')
    const tooRecent = results.filter((r) => r.status === 'too_recent')

    console.log(`[ranking-check] Résultats : ${rankingWell.length} bien rankées, ${progressing.length} en progression, ${stagnating.length} stagnantes, ${notIndexed.length} non indexées, ${tooRecent.length} trop récentes`)

    const formatLine = (r) => {
      const pos = r.sc.position > 0 ? `pos ${Math.round(r.sc.position)}` : 'pas indexée'
      const imp = r.sc.impressions > 0 ? `${r.sc.impressions} imp` : '0 imp'
      const clicks = r.sc.clicks > 0 ? ` · ${r.sc.clicks} clics` : ''
      return `  • *${r.cs.title}* — ${pos}, ${imp}${clicks} (${r.agedays}j)`
    }

    let reportLines = [`📊 *Rapport SEO hebdo — cas d'usage générés*\n_${recentCases.length} pages vérifiées, 28 derniers jours_\n`]

    if (rankingWell.length > 0) {
      reportLines.push(`\n✅ *Bien rankées (pos 1-10) — ${rankingWell.length}*`)
      reportLines.push(...rankingWell.slice(0, 5).map(formatLine))
    }

    if (progressing.length > 0) {
      reportLines.push(`\n📈 *En progression (pos 11-30) — ${progressing.length}*`)
      reportLines.push(...progressing.slice(0, 5).map(formatLine))
    }

    if (stagnating.length > 0) {
      reportLines.push(`\n⚠️ *Stagnantes (pos 30+) — ${stagnating.length}*`)
      reportLines.push(...stagnating.slice(0, 5).map(formatLine))
      reportLines.push(`  _→ Envisager d'améliorer le contenu ou d'ajouter du maillage interne_`)
    }

    if (notIndexed.length > 0) {
      reportLines.push(`\n🔴 *Non indexées (0 imp après 14j) — ${notIndexed.length}*`)
      reportLines.push(...notIndexed.slice(0, 5).map(formatLine))
      reportLines.push(`  _→ Soumettre manuellement dans Search Console_`)
    }

    if (tooRecent.length > 0) {
      reportLines.push(`\n⏳ *Trop récentes (<14j) — ${tooRecent.length}* (pas encore indexées, normal)`)
    }

    reportLines.push(`\n_Cron: /api/cron/case-studies-ranking-check_`)

    await sendTelegram(reportLines.join('\n'))

    return res.status(200).json({
      ok: true,
      checked: recentCases.length,
      rankingWell: rankingWell.length,
      progressing: progressing.length,
      stagnating: stagnating.length,
      notIndexed: notIndexed.length,
      tooRecent: tooRecent.length,
    })
  } catch (error) {
    console.error('[ranking-check] Erreur:', error)
    return res.status(500).json({ error: error.message })
  }
}
