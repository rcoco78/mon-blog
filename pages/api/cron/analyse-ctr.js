/**
 * Cron quotidien : analyse CTR — pages à fort potentiel (imp élevées, CTR faible)
 * Envoie suggestions titre/meta via Telegram, trace dans blob pour éviter répétition
 *
 * Variables d'env : CRON_SECRET, OPENAI_API_KEY, GOOGLE_SERVICE_ACCOUNT_KEY,
 *                   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, NOTION_TOKEN, NOTION_DATABASE_ID (blog)
 */

import { list, put } from '@vercel/blob'
import { getSearchConsolePagesForCTR, getTopQueriesForPages } from '../../../lib/search-console'
import {
  getPageSource,
  fetchPageMeta,
  fetchPageContextFromBlob,
  getSuggestionsFromGPT,
  applyOptimizationToBlob,
} from '../../../lib/ctr-analysis'

const BLOB_FILENAME = 'ctr-analysis-state.json'
const PAGES_PER_RUN = 5
const COOLDOWN_DAYS = 30 // Ne pas ré-analyser une page avant 30 jours

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
    // Garder les entrées récentes seulement (COOLDOWN_DAYS + 5j de marge)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - (COOLDOWN_DAYS + 5))
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

function formatForTelegram(results, pipeline = {}) {
  const applied = results.filter((r) => r.applied).length
  const pipelineStr = pipeline.sc != null
    ? `_Pipeline : ${pipeline.sc} SC → ${pipeline.eligible} éligibles → ${pipeline.available} dispo → ${pipeline.cooldown} en cooldown_`
    : ''
  const lines = [
    `📈 *Analyse CTR — ${applied}/${results.length} optimisation(s) appliquée(s)*`,
    pipelineStr,
    '',
  ]
  for (const r of results) {
    const posEmoji = r.position <= 3 ? '🥇' : r.position <= 10 ? '🎯' : r.position <= 20 ? '📈' : '💤'
    lines.push(`${posEmoji} *${r.path}*`)
    lines.push(`   Imp: ${r.impressions} | CTR: ${r.ctr.toFixed(1)}% | Pos: ${Math.round(r.position)}`)
    if (r.topQuery) lines.push(`   🔑 Requête #1 : \`${r.topQuery}\``)
    const best = r.suggestions?.[0]
    if (best) {
      lines.push(`   ✏️ Titre: \`${(best.title || '').slice(0, 60)}${(best.title || '').length > 60 ? '…' : ''}\``)
      lines.push(`   ✏️ Meta: \`${(best.metaDescription || '').slice(0, 90)}${(best.metaDescription || '').length > 90 ? '…' : ''}\``)
      lines.push(`   ${r.applied ? '✅ Appliqué' : `⚠️ Non appliqué: ${r.applyError || '?'}`}`)
    } else {
      lines.push(`   ⚠️ Aucune suggestion GPT`)
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

    const allPages = await getSearchConsolePagesForCTR({
      days: 90,
      minImpressions: 10,   // abaissé : inclut les pages récentes dès 10 impressions
      maxCtrPercent: 5.0,   // élargi : on optimise aussi les pages à CTR modéré
    })

    console.log(`[analyse-ctr] SC retourne ${allPages.length} pages avec ≥10 imp et CTR <5%`)

    const OPTIMIZABLE_SOURCES = ['blog', 'cas-usage', 'marketplace']

    // Enrichir avec un score de priorité : positions 4-20 = jackpot CTR
    const scoredPages = allPages
      .filter((p) => OPTIMIZABLE_SOURCES.includes(getPageSource(p.path).source))
      .map((p) => {
        // Score = potentiel d'amélioration CTR
        // Prio forte : pos 4-10 (quasi 1ère page, CTR bas = opportunité directe)
        // Prio moyenne : pos 11-20 (page 2, CTR très faible mais impressions parfois élevées)
        // Prio faible : pos 1-3 (déjà bien placé) ou pos >20 (trop loin)
        let posScore = 0
        if (p.position >= 4 && p.position <= 10) posScore = 30
        else if (p.position > 10 && p.position <= 20) posScore = 20
        else if (p.position > 20 && p.position <= 35) posScore = 10
        else if (p.position <= 3) posScore = 5 // déjà bien, moins urgent

        // Plus d'impressions = plus d'impact potentiel
        const impScore = Math.min(Math.log10(p.impressions + 1) * 10, 30)

        // Moins le CTR est bon (vs position attendue), plus c'est urgent
        const expectedCtr = p.position <= 3 ? 20 : p.position <= 10 ? 5 : 1
        const ctrGap = Math.max(0, expectedCtr - p.ctr)
        const ctrScore = Math.min(ctrGap * 2, 40)

        return { ...p, _priority: posScore + impScore + ctrScore }
      })
      .sort((a, b) => b._priority - a._priority)

    console.log(`[analyse-ctr] ${scoredPages.length} pages éligibles (sources reconnues)`)

    // Séparer en cooldown / disponibles
    const inCooldown = scoredPages.filter((p) => {
      if (force) return false
      const lastAt = state.analyzedPaths[p.path]
      return lastAt && new Date(lastAt) >= cutoff
    })
    const available = scoredPages.filter((p) => {
      if (force) return true
      const lastAt = state.analyzedPaths[p.path]
      return !lastAt || new Date(lastAt) < cutoff
    })

    console.log(`[analyse-ctr] ${available.length} disponibles, ${inCooldown.length} en cooldown (${COOLDOWN_DAYS}j)`)

    const toAnalyze = available.slice(0, PAGES_PER_RUN)

    if (toAnalyze.length === 0) {
      const nextRelease = inCooldown.length > 0
        ? (() => {
            const soonest = inCooldown.reduce((min, p) => {
              const d = new Date(state.analyzedPaths[p.path])
              d.setDate(d.getDate() + COOLDOWN_DAYS)
              return d < min ? d : min
            }, new Date(9999, 0))
            return soonest.toLocaleDateString('fr-FR')
          })()
        : null

      const reason = allPages.length === 0
        ? 'Search Console ne retourne aucune page (données insuffisantes ou config SC)'
        : scoredPages.length === 0
          ? 'Aucune page dans les sources reconnues (blog/cas-usage/marketplace)'
          : inCooldown.length > 0
            ? `${inCooldown.length} pages en cooldown (${COOLDOWN_DAYS}j), prochaine dispo : ${nextRelease}`
            : 'Pool vide'

      const msg = `📈 *Analyse CTR* : Rien à analyser aujourd'hui.\n_Raison : ${reason}_\n\n` +
        `📊 Pipeline : ${allPages.length} pages SC → ${scoredPages.length} éligibles → ${available.length} dispo → ${inCooldown.length} en cooldown`
      await sendTelegram(msg)
      console.log(`[analyse-ctr] Skip — ${reason}`)
      return res.status(200).json({ ok: true, analyzed: 0, message: reason, pipeline: { sc: allPages.length, eligible: scoredPages.length, available: available.length, cooldown: inCooldown.length } })
    }

    console.log(`[analyse-ctr] Analyse de ${toAnalyze.length} pages :`, toAnalyze.map((p) => `${p.path} (prio ${Math.round(p._priority)}, pos ${Math.round(p.position)})`).join(', '))

    // Un seul call SC pour récupérer les top queries de toutes les pages à analyser
    const paths = toAnalyze.map((p) => p.path)
    const topQueriesByPage = await getTopQueriesForPages(paths, { days: 90 }).catch(() => ({}))
    console.log(`[analyse-ctr] Top queries récupérées pour ${Object.keys(topQueriesByPage).length}/${paths.length} pages`)

    const newAnalyzedPaths = { ...state.analyzedPaths }

    // Paralléliser les appels meta + contexte + GPT pour rester sous 60s
    const results = await Promise.all(
      toAnalyze.map(async (page) => {
        const topQueries = topQueriesByPage[page.path] || []
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
          topQueries,
        )
        const source = getPageSource(page.path)

        let applied = false
        let applyError = null
        const best = suggestions?.[0]
        if (best && source.identifier) {
          const applyResult = await applyOptimizationToBlob(source, best)
          applied = applyResult.applied
          applyError = applyResult.error
        }

        newAnalyzedPaths[page.path] = new Date().toISOString()

        return {
          path: page.path,
          impressions: page.impressions,
          clicks: page.clicks,
          ctr: page.ctr,
          position: page.position,
          _priority: page._priority,
          topQuery: topQueries[0]?.query || null,
          currentTitle: meta.title,
          currentMeta: meta.metaDescription,
          source,
          suggestions,
          applied,
          applyError,
        }
      })
    )

    const pipeline = {
      sc: allPages.length,
      eligible: scoredPages.length,
      available: available.length,
      cooldown: inCooldown.length,
    }

    await saveState(newAnalyzedPaths)
    await sendTelegram(formatForTelegram(results, pipeline))

    return res.status(200).json({
      ok: true,
      analyzed: results.length,
      applied: results.filter((r) => r.applied).length,
      pipeline,
      pages: results.map((r) => ({ path: r.path, source: r.source.source, applied: r.applied, priority: Math.round(r._priority || 0) })),
    })
  } catch (error) {
    console.error('[analyse-ctr] Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
