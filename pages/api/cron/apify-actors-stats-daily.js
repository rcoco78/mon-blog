/**
 * Cron quotidien : stats Apify actors (users daily + delta vs veille)
 *
 * 1. Récupère totalUsers depuis l'API Apify
 * 2. Compare avec le snapshot de la veille (Blob)
 * 3. Met à jour Utilisateurs + Variation dans la base Notion principale (vidéos)
 * 4. Envoie un brief Telegram : top 3 progression, top 3 stagnation
 *
 * Schedule : 1x/jour (8h)
 * Variables : CRON_SECRET, BLOB_READ_WRITE_TOKEN, NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

import { getApifyActors } from '../../../lib/apify-actors-api'
import { getLastSnapshot, saveSnapshot } from '../../../lib/apify-actors-stats-history'
import { updateActorStats } from '../../../lib/apify-actors-notion-sync'

const APIFY_USERNAME = process.env.APIFY_PROFILE_USERNAME || 'corent1robert'

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  }).catch((e) => console.warn('[apify-stats-daily] Telegram:', e.message))
}

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const hasValidSecret =
    process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL

  if (!isVercelCron && !hasValidSecret && !isLocalDev) {
    return res.status(401).json({
      message: 'Unauthorized',
      hint: 'Vercel Cron ou Authorization: Bearer CRON_SECRET requis',
    })
  }

  try {
    const today = new Date().toISOString().slice(0, 10)
    const actors = await getApifyActors(APIFY_USERNAME)
    const lastSnap = await getLastSnapshot()

    const currentMap = Object.fromEntries(actors.map((a) => [a.slug, a.stats.totalUsers]))
    const prevMap = lastSnap?.actors || {}

    const rows = actors.map((a) => {
      const users = a.stats.totalUsers
      const prevUsers = prevMap[a.slug]
      const delta = prevUsers != null ? users - prevUsers : 0
      return {
        slug: a.slug,
        title: a.title,
        url: a.url,
        users,
        delta,
      }
    })

    await saveSnapshot(today, currentMap)

    const mainDbId =
      process.env.NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID || process.env.NOTION_APIFY_ACTORS_DATABASE_ID
    if (mainDbId) {
      let ok = 0
      for (const row of rows) {
        const updated = await updateActorStats(row.slug, { users: row.users, variation: row.delta })
        if (updated) ok++
        await new Promise((r) => setTimeout(r, 120))
      }
      console.log('[apify-stats-daily] Notion:', ok, '/', rows.length, 'lignes mises à jour')
    }

    const withDelta = rows.filter((r) => r.delta !== 0)
    const progression = [...withDelta].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta)
    const stagnation = [...withDelta].filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta)

    const top3Prog = progression.slice(0, 3)
    const top3Stag = stagnation.slice(0, 3)

    let tgText = `📊 *Apify Actors • Stats ${today}*\n\n`
    if (top3Prog.length > 0) {
      tgText += `🚀 *Top 3 progression*\n`
      top3Prog.forEach((r, i) => {
        tgText += `${i + 1}. ${r.title} +${r.delta} users (${r.users} total)\n`
      })
      tgText += `\n`
    }
    if (top3Stag.length > 0) {
      tgText += `📉 *Top 3 en baisse*\n`
      top3Stag.forEach((r, i) => {
        tgText += `${i + 1}. ${r.title} ${r.delta} users (${r.users} total)\n`
      })
    }
    if (top3Prog.length === 0 && top3Stag.length === 0) {
      tgText += `Aucun changement vs hier.\n`
    }

    await sendTelegram(tgText)

    return res.status(200).json({
      ok: true,
      date: today,
      actors: rows.length,
      progression: top3Prog.length,
      stagnation: top3Stag.length,
    })
  } catch (err) {
    console.error('[apify-stats-daily]', err)
    return res.status(500).json({ error: err.message })
  }
}

export const config = {
  maxDuration: 60,
}
