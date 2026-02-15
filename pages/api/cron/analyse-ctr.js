/**
 * Cron quotidien : analyse CTR — pages à fort potentiel (imp élevées, CTR faible)
 * Envoie suggestions titre/meta via Telegram, trace dans blob pour éviter répétition
 *
 * Variables d'env : CRON_SECRET, OPENAI_API_KEY, GOOGLE_SERVICE_ACCOUNT_KEY,
 *                   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, NOTION_TOKEN, NOTION_DATABASE_ID (blog)
 */

import { list, put } from '@vercel/blob'
import { getSearchConsolePagesForCTR } from '../../../lib/search-console'
import {
  getPageSource,
  fetchPageMeta,
  fetchPageContextFromBlob,
  getSuggestionsFromGPT,
  applyOptimizationToBlob,
} from '../../../lib/ctr-analysis'

const BLOB_FILENAME = 'ctr-analysis-state.json'
const PAGES_PER_RUN = 3
const COOLDOWN_DAYS = 60 // Ne pas ré-analyser une page avant 60 jours

async function loadState() {
  try {
    const blobs = await list({ prefix: BLOB_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === BLOB_FILENAME)
    if (!blob) return { analyzedPaths: {} }
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) return { analyzedPaths: {} }
    const data = await res.json()
    return { analyzedPaths: data.analyzedPaths || {} }
  } catch {
    return { analyzedPaths: {} }
  }
}

async function saveState(analyzedPaths) {
  try {
    // Garder les 65 derniers jours (>= COOLDOWN_DAYS pour le cooldown)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 65)
    const pruned = {}
    for (const [p, at] of Object.entries(analyzedPaths)) {
      if (new Date(at) > cutoff) pruned[p] = at
    }
    await put(
      BLOB_FILENAME,
      JSON.stringify({ analyzedPaths: pruned, lastRunAt: new Date().toISOString() }, null, 2),
      { access: 'public', allowOverwrite: true },
    )
  } catch (e) {
    console.warn('[analyse-ctr] Impossible de sauver state:', e.message)
  }
}

function formatForTelegram(results) {
  const lines = [
    '📈 *Analyse CTR — Optimisation auto appliquée*',
    '',
    `📊 ${results.length} page(s) optimisée(s) ce run`,
    '',
  ]
  for (const r of results) {
    lines.push(`📄 *${r.path}*`)
    lines.push(`   Imp: ${r.impressions} | CTR: ${r.ctr.toFixed(1)}% | Pos: ${Math.round(r.position)}`)
    const best = r.suggestions?.[0]
    if (best) {
      lines.push(`   ✅ Titre: \`${(best.title || '').slice(0, 55)}${(best.title || '').length > 55 ? '...' : ''}\``)
      lines.push(`   ✅ Meta: \`${(best.metaDescription || '').slice(0, 80)}${(best.metaDescription || '').length > 80 ? '...' : ''}\``)
      lines.push(`   ${r.applied ? '✅ Appliqué au blob' : `⚠️ Non appliqué: ${r.applyError || '?'}`}`)
    }
    lines.push('')
  }
  lines.push('_Cron: /api/cron/analyse-ctr (gpt-4o)_')
  return lines.join('\n')
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
  } catch (e) {
    console.warn('[analyse-ctr] Telegram error:', e.message)
  }
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
    const force = req.query?.force === '1' || req.query?.force === 'true'
    const state = await loadState()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - COOLDOWN_DAYS)

    const pages = await getSearchConsolePagesForCTR({
      days: 90,
      minImpressions: 30,
      maxCtrPercent: 2.5,
    })

    const OPTIMIZABLE_SOURCES = ['blog', 'cas-usage', 'marketplace']
    const toAnalyze = pages
      .filter((p) => OPTIMIZABLE_SOURCES.includes(getPageSource(p.path).source))
      .filter((p) => {
        if (force) return true
        const lastAt = state.analyzedPaths[p.path]
        return !lastAt || new Date(lastAt) < cutoff
      })
      .slice(0, PAGES_PER_RUN)

    if (toAnalyze.length === 0) {
      const msg = '📈 Analyse CTR : Aucune nouvelle page à analyser (toutes récentes ou pool vide).'
      await sendTelegram(msg)
      return res.status(200).json({ ok: true, analyzed: 0, message: 'No new pages' })
    }

    const results = []
    const newAnalyzedPaths = { ...state.analyzedPaths }

    for (const page of toAnalyze) {
      const [meta, pageContext] = await Promise.all([
        fetchPageMeta(page.path),
        fetchPageContextFromBlob(page.path),
      ])
      const suggestions = await getSuggestionsFromGPT(
        page.path,
        meta.title,
        meta.metaDescription,
        page.impressions,
        page.ctr,
        page.position,
        pageContext,
      )
      const source = getPageSource(page.path)

      // Application auto de la meilleure suggestion au blob
      let applied = false
      let applyError = null
      const best = suggestions?.[0]
      if (best && source.identifier) {
        const applyResult = await applyOptimizationToBlob(source, best)
        applied = applyResult.applied
        applyError = applyResult.error
      }

      results.push({
        path: page.path,
        impressions: page.impressions,
        clicks: page.clicks,
        ctr: page.ctr,
        position: page.position,
        currentTitle: meta.title,
        currentMeta: meta.metaDescription,
        source,
        suggestions,
        applied,
        applyError,
      })
      newAnalyzedPaths[page.path] = new Date().toISOString()
    }

    await saveState(newAnalyzedPaths)
    await sendTelegram(formatForTelegram(results))

    return res.status(200).json({
      ok: true,
      analyzed: results.length,
      applied: results.filter((r) => r.applied).length,
      pages: results.map((r) => ({ path: r.path, source: r.source.source, applied: r.applied })),
    })
  } catch (error) {
    console.error('[analyse-ctr] Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
