// Cron Vercel pour générer automatiquement de nouveaux cas d'usage scraping
// Objectif : chaque appel ajoute quelques nouveaux case studies "intelligents"
// au blob `case-studies.json`, sans dupliquer les cas existants.
//
// À utiliser avec un Cron Vercel, par ex. 1x/jour.
//
// Variables d'environnement nécessaires :
// - CRON_SECRET           : token pour sécuriser l'endpoint (optionnel mais recommandé)
// - OPENAI_API_KEY        : clé OpenAI pour la génération
// - CASE_STUDIES_PER_RUN  : (optionnel) nombre de nouveaux cas à générer par exécution (défaut: 8)

import { list, put } from '@vercel/blob'
import { putCaseStudiesSplit } from '../../../lib/case-studies-blob-write'
import { caseStudies as localCaseStudies } from '../../../lib/case-studies'
import { siteConfig } from '../../../lib/config'
import { sectorToSlug } from '../../../lib/case-studies-helpers'
import { getSearchConsoleData } from '../../../lib/search-console'

const BLOB_FILENAME = 'case-studies.json'
const SEARCH_CONSOLE_STATE_FILENAME = 'search-console-state.json'

// Petit helper pour slugifier un titre
function slugify(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-') // tout en tirets
    .replace(/^-+|-+$/g, '')
}

const EXCLUSION_DAYS = 7 // Exclure les requêtes consommées sur les 7 derniers jours

// Charger l'état Search Console (requêtes consommées sur les N derniers jours)
async function loadSearchConsoleState() {
  try {
    const blobs = await list({ prefix: SEARCH_CONSOLE_STATE_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === SEARCH_CONSOLE_STATE_FILENAME)
    if (!blob) return { lastTargetedQueries: [] }
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) return { lastTargetedQueries: [] }
    const data = await res.json()

    // targetedHistory = [{ queries, usedAt }] — cumul sur 7 jours
    let history = data.targetedHistory || []
    if (history.length === 0 && Array.isArray(data.lastTargetedQueries) && data.lastTargetedQueries.length > 0) {
      history = [{ queries: data.lastTargetedQueries, usedAt: data.lastRunAt || new Date().toISOString() }]
    }
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - EXCLUSION_DAYS)
    const recent = history.filter((h) => new Date(h.usedAt) > cutoff)
    const allQueries = new Set()
    for (const h of recent) {
      for (const q of h.queries || []) allQueries.add(q)
    }
    return { lastTargetedQueries: [...allQueries] }
  } catch {
    return { lastTargetedQueries: [] }
  }
}

// Matching case → query via LLM : quelle requête Search Console ce cas cible-t-il ?
async function findMatchingQueriesWithLLM(generated, queriesPassed) {
  if (!generated?.length || !queriesPassed?.length) return new Map()
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) return new Map()

  const casesDesc = generated.map((c, i) => `[${i}] "${c.title}" | keywords: ${(c.keywords || []).slice(0, 5).join(', ')} | examples: ${(c.examples || []).slice(0, 2).join(', ')}`).join('\n')
  const queriesList = queriesPassed.slice(0, 50).map((q, i) => `${i}: "${q}"`).join('\n')

  const prompt = `Tu es un expert SEO. Pour chaque cas d'usage ci-dessous, identifie la requête Search Console (dans la liste) qu'il cible le plus probablement.
Si aucun match évident, retourne null pour ce cas.

CAS D'USAGE :
${casesDesc}

REQUÊTES SEARCH CONSOLE :
${queriesList}

Réponds UNIQUEMENT par un JSON valide :
{ "0": "requête exacte ou null", "1": "requête ou null", ... }
(clé = index du cas, valeur = requête de la liste ou null)`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'Tu réponds UNIQUEMENT en JSON valide, sans texte autour.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!response.ok) return new Map()
    const data = await response.json()
    let content = data.choices?.[0]?.message?.content?.trim() || '{}'
    content = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(content)
    const map = new Map()
    for (const [idx, query] of Object.entries(parsed)) {
      const i = parseInt(idx, 10)
      if (!isNaN(i) && generated[i] && query && typeof query === 'string' && queriesPassed.includes(query)) {
        map.set(i, query)
      }
    }
    return map
  } catch (e) {
    console.warn('[findMatchingQueriesWithLLM] Erreur:', e.message)
    return new Map()
  }
}

// Sauvegarder l'état Search Console (cumul sur 7 jours)
async function saveSearchConsoleState(queriesUsedForCreatedPages) {
  try {
    const blobs = await list({ prefix: SEARCH_CONSOLE_STATE_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === SEARCH_CONSOLE_STATE_FILENAME)
    let history = []
    if (blob) {
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        history = data.targetedHistory || []
      }
    }

    if (queriesUsedForCreatedPages.length > 0) {
      history.push({
        queries: queriesUsedForCreatedPages,
        usedAt: new Date().toISOString(),
      })
    }

    // Garder uniquement les 7 derniers jours
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - EXCLUSION_DAYS)
    history = history.filter((h) => new Date(h.usedAt) > cutoff)

    await put(
      SEARCH_CONSOLE_STATE_FILENAME,
      JSON.stringify({
        targetedHistory: history,
        lastRunAt: new Date().toISOString(),
      }, null, 2),
      { access: 'public', allowOverwrite: true },
    )
  } catch (e) {
    console.warn('[generate-new-case-studies] Impossible de sauver search-console-state:', e.message)
  }
}

// Charger le blob brut (objet complet { caseStudies, personalizedCount, ... })
async function loadBlobData() {
  try {
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

    if (!existingBlob) {
      return null
    }

    const response = await fetch(existingBlob.url, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data || !Array.isArray(data.caseStudies)) {
      return null
    }

    return { data, blobUrl: existingBlob.url }
  } catch (error) {
    console.warn('[generate-new-case-studies] Erreur lors du chargement du blob:', error.message)
    return null
  }
}

// Fallback : reconstruire une structure de blob minimale depuis le fichier local
function buildBlobFromLocal() {
  const caseStudiesData = localCaseStudies.map((cs) => ({
    slug: cs.slug,
    sector: cs.sector,
    title: cs.title,
    description: cs.description,
    useCase: cs.useCase,
    dataExtracted: cs.dataExtracted,
    benefits: cs.benefits,
    examples: cs.examples,
    keywords: cs.keywords,
    personalized: cs.personalized || undefined,
  }))

  const personalizedCount = caseStudiesData.filter((cs) => !!cs.personalized).length

  return {
    caseStudies: caseStudiesData,
    personalizedCount,
    personalizedAvailable: personalizedCount,
    lastUpdated: new Date().toISOString(),
    count: caseStudiesData.length,
  }
}

// Envoyer une notification Telegram (optionnel, si TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID sont définis)
async function sendTelegramNotification(newCases, stats = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId || !newCases || newCases.length === 0) {
    return
  }

  const baseUrl = siteConfig?.url || 'https://www.corentinrobert.fr'

  const lines = newCases.map((cs) => {
    const sector = cs.sector || 'Secteur inconnu'
    const title = cs.title || cs.slug
    const slugSector = sectorToSlug
      ? sectorToSlug(sector)
      : (sector || '').toLowerCase().replace(/\s+/g, '-')
    const url = `${baseUrl}/cas-usage/${slugSector}/${cs.slug}`
    const score =
      typeof cs.attractivenessScore === 'number'
        ? ` (${cs.attractivenessScore}/100)`
        : ''
    return `• *${title}* — _${sector}_${score}\n  ${url}`
  })

  const { rejectedCount = 0, scOpportunities = 0, isRetry = false, totalCases = 0 } = stats

  const statusLine = isRetry ? `⚡ _2 passes nécessaires_` : `✅ _Passe 1 suffisante_`
  const statsLine = [
    scOpportunities > 0 ? `📊 ${scOpportunities} opportunités SC` : null,
    rejectedCount > 0 ? `🚫 ${rejectedCount} rejetés` : null,
    totalCases > 0 ? `📚 Total base : ${totalCases}` : null,
  ].filter(Boolean).join(' · ')

  const text =
    `🆕 *${newCases.length} nouveaux cas d'usage*\n` +
    `${statusLine}${statsLine ? `\n${statsLine}` : ''}\n\n` +
    lines.join('\n\n') +
    `\n\n_Job: /api/cron/generate-new-case-studies_`

  const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
  }

  try {
    const resp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      const body = await resp.text()
      console.warn(
        '[generate-new-case-studies] Échec de la notification Telegram:',
        resp.status,
        body.slice(0, 200),
      )
    }
  } catch (error) {
    console.warn(
      '[generate-new-case-studies] Erreur lors de l\'envoi Telegram:',
      error.message,
    )
  }
}

// Tokeniser un texte pour comparaison de similarité (mots significatifs, sans accents)
function tokenizeForSimilarity(str) {
  if (!str || typeof str !== 'string') return []
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

// Similarité Jaccard entre deux textes (0 = aucun mot commun, 1 = identique)
function jaccardSimilarity(text1, text2) {
  const set1 = new Set(tokenizeForSimilarity(text1))
  const set2 = new Set(tokenizeForSimilarity(text2))
  if (set1.size === 0) return 0
  let intersection = 0
  for (const w of set1) {
    if (set2.has(w)) intersection++
  }
  const union = set1.size + set2.size - intersection
  return union === 0 ? 0 : intersection / union
}

// Extraire plateforme et angle d'un titre "Scraping [Platform] : [Angle]"
function parseTitle(title) {
  const t = (title || '').trim()
  const match = t.match(/^scraping\s+([^:]+)\s*:\s*(.+)$/i)
  if (match) {
    return {
      platform: match[1].trim().toLowerCase(),
      angle: match[2].trim().toLowerCase(),
      full: t.toLowerCase(),
    }
  }
  return { platform: null, angle: null, full: t.toLowerCase() }
}

// Mots à ignorer dans la comparaison (structure commune, peu discriminants)
const STOP_WORDS = new Set([
  'scraping', 'extraction', 'des', 'du', 'de', 'la', 'le', 'les', 'et', 'pour', 'sur', 'avec', 'par', 'en',
])
function meaningfulWords(text) {
  return tokenizeForSimilarity(text).filter((w) => !STOP_WORDS.has(w) && w.length > 2)
}

// Collecter les cas existants potentiellement similaires (pour script + IA)
// Retourne [{ existing, score, type, reason }] trié par score décroissant
function findSimilarCandidates(newCase, existingCases) {
  const candidates = []
  const newTitle = (newCase.title || '').toLowerCase().trim()
  const newParsed = parseTitle(newCase.title)
  const newKeywords = new Set(
    (newCase.keywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean),
  )
  const newSector = (newCase.sector || '').toLowerCase().trim()

  for (const existing of existingCases) {
    const existingTitle = (existing.title || '').toLowerCase().trim()
    if (!existingTitle) continue

    const existingParsed = parseTitle(existing.title)
    // PLATEFORME DIFFÉRENTE = pas de cannibalisation (Doctolib ≠ ZnamyLekar, La Fourchette ≠ générique)
    if (newParsed.platform && existingParsed.platform && newParsed.platform !== existingParsed.platform) {
      continue // ignorer, pas un candidat doublon
    }
    let score = 0
    let type = ''
    let reason = ''

    // 1) MÊME PLATEFORME : score = similarité de l'angle uniquement
    if (newParsed.platform && existingParsed.platform && newParsed.platform === existingParsed.platform) {
      const newAngleWords = meaningfulWords(newParsed.angle)
      const existingAngleWords = meaningfulWords(existingParsed.angle)
      if (newAngleWords.length > 0 && existingAngleWords.length > 0) {
        const angleSetNew = new Set(newAngleWords)
        const angleSetExisting = new Set(existingAngleWords)
        let inter = 0
        for (const w of angleSetNew) {
          if (angleSetExisting.has(w)) inter++
        }
        score = inter / (angleSetNew.size + angleSetExisting.size - inter)
        type = 'angle'
        reason = `même plateforme "${newParsed.platform}"`
      }
    } else {
      // 2) PLATEFORMES DIFFÉRENTES : score = similarité titre entier
      score = jaccardSimilarity(newTitle, existingTitle)
      type = 'title'
      reason = 'titre similaire'
    }

    // 3) Boost si overlap keywords fort (même secteur)
    const existingSector = (existing.sector || '').toLowerCase().trim()
    const existingKeywords = new Set(
      (existing.keywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean),
    )
    if (newSector === existingSector && newKeywords.size > 0 && existingKeywords.size > 0) {
      let overlap = 0
      for (const k of newKeywords) {
        if (existingKeywords.has(k)) overlap++
      }
      const kwRatio = overlap / Math.min(newKeywords.size, existingKeywords.size)
      if (kwRatio > 0.4) {
        score = Math.max(score, kwRatio)
        if (type === '') type = 'keywords'
        reason = reason || `mots-clés similaires (${(kwRatio * 100).toFixed(0)}%)`
      }
    }

    if (score >= 0.35) {
      candidates.push({
        existing,
        score,
        type,
        reason: reason || `${(score * 100).toFixed(0)}%`,
      })
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5)
}

// Demander à l'IA : ce cas est-il un vrai doublon à rejeter ?
async function askAIDuplicateDecision(newCase, candidates) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    return { isDuplicate: false, reason: 'No API key' }
  }

  const topCandidates = candidates.slice(0, 3).map((c) => ({
    title: c.existing.title,
    sector: c.existing.sector,
    keywords: (c.existing.keywords || []).slice(0, 5),
    score: (c.score * 100).toFixed(0),
  }))

  const prompt = `Tu es un expert SEO et en cas d'usage de scraping. Un nouveau cas d'usage a été proposé. Des cas existants potentiellement similaires ont été identifiés par un script (scores de similarité).

NOUVEAU CAS PROPOSÉ :
- Titre: ${newCase.title}
- Secteur: ${newCase.sector}
- Mots-clés SEO: ${(newCase.keywords || []).join(', ')}

CAS EXISTANTS POTENTIELLEMENT SIMILAIRES (script) :
${JSON.stringify(topCandidates, null, 2)}

QUESTION : Le nouveau cas est-il un VRAI DOUBLON à rejeter ? C'est-à-dire : est-ce que ce cas cannibaliserait un existant (même intention de recherche, même cible) ou ajoute-t-il un angle distinct qui mérite sa propre page ?

RÈGLE PRINCIPALE : PLATEFORME DIFFÉRENTE = ACCEPTER (pas de cannibalisation).
- "Scraping Doctolib" vs "Scraping ZnamyLekar" → plateformes différentes = ACCEPTER
- "Scraping La Fourchette" vs cas générique "avis restaurants" → plateforme spécifique = ACCEPTER
- "Scraping Glassdoor" vs "Scraping [autre plateforme] salaires" → ACCEPTER
- "TikTok vidéos voyage" vs "TikTok vidéos par son" → angles différents = ACCEPTER
- "TripAdvisor avis restaurants" vs "TripAdvisor avis hôtels" → niches différentes = ACCEPTER

REJETER UNIQUEMENT si MÊME plateforme + MÊME angle :
- "TripAdvisor avis restaurants" vs "TripAdvisor avis clients restauration" → même chose
- "LinkedIn extraction profils" vs "LinkedIn extraction des profils" → variante minimale

Réponds UNIQUEMENT par un JSON valide :
{ "isDuplicate": true ou false, "reason": "Une phrase courte expliquant la décision" }`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 150,
        messages: [
          {
            role: 'system',
            content:
              'Tu réponds toujours par un JSON valide uniquement, sans texte autour. Format: {"isDuplicate": boolean, "reason": "string"}',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      console.warn('[askAIDuplicateDecision] API error:', response.status)
      return { isDuplicate: false, reason: 'API error' }
    }

    const data = await response.json()
    let content = data.choices?.[0]?.message?.content?.trim() || ''
    content = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(content)
    return {
      isDuplicate: Boolean(parsed.isDuplicate),
      reason: parsed.reason || '',
    }
  } catch (e) {
    console.warn('[askAIDuplicateDecision] Error:', e.message)
    return { isDuplicate: false, reason: 'Parse error' }
  }
}

// Décision finale : script + IA en zone incertaine
// Zones : score < 0.45 = accept | 0.45-0.75 = IA décide | >= 0.75 = reject
// (seuil relevé pour réduire les rejets excessifs de l'IA en zone limite)
async function shouldRejectCase(newCase, existingCases) {
  const candidates = findSimilarCandidates(newCase, existingCases)
  const best = candidates[0]

  if (!best || best.score < 0.45) {
    return { reject: false, reason: '' }
  }

  if (best.score >= 0.75) {
    return {
      reject: true,
      reason: `${best.reason} — "${best.existing.title}" (${(best.score * 100).toFixed(0)}%)`,
      matched: best.existing,
    }
  }

  // Zone incertaine : l'IA tranche (script seul ne suffit pas)
  const aiDecision = await askAIDuplicateDecision(newCase, candidates)
  if (aiDecision.isDuplicate) {
    return {
      reject: true,
      reason: `IA: ${aiDecision.reason}`,
      matched: best.existing,
    }
  }
  if (aiDecision.reason) {
    console.log(`[generate-new-case-studies] IA accepte (zone incertaine ${(best.score * 100).toFixed(0)}%): ${newCase.title} — ${aiDecision.reason}`)
  }
  return { reject: false, reason: aiDecision.reason ? `IA: ${aiDecision.reason}` : '' }
}

// Analyser les "zones blanches" : angles peu couverts pour guider l'IA vers des cas originaux
function computeGaps(existingCaseStudies) {
  const sectorCounts = {}
  const sectorDataTypes = {} // secteur -> Set des types de données utilisés
  const sectorPlatforms = {} // secteur -> Set des plateformes/sources (examples)
  const dataTypeBySector = {} // (sector, dataType) -> count
  const platformBySector = {} // (sector, platform) -> count

  for (const cs of existingCaseStudies) {
    const sector = cs.sector || 'Autres'
    sectorCounts[sector] = (sectorCounts[sector] || 0) + 1

    if (!sectorDataTypes[sector]) sectorDataTypes[sector] = new Set()
    for (const d of cs.dataExtracted || []) {
      const dn = d.toLowerCase().trim()
      if (dn.length > 3) {
        sectorDataTypes[sector].add(dn)
        const key = `${sector}|||${dn}`
        dataTypeBySector[key] = (dataTypeBySector[key] || 0) + 1
      }
    }

    for (const ex of cs.examples || []) {
      const plat = String(ex).trim()
      if (plat.length >= 2 && plat.length < 50) {
        if (!sectorPlatforms[sector]) sectorPlatforms[sector] = new Set()
        sectorPlatforms[sector].add(plat)
        const key = `${sector}|||${plat}`
        platformBySector[key] = (platformBySector[key] || 0) + 1
      }
    }
  }

  // 1) Secteurs sous-représentés (ceux avec le moins de cas)
  // + ROTATION : pénaliser les secteurs générés récemment (7 derniers jours)
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const recentSectors = new Set()
  for (const cs of existingCaseStudies) {
    if (cs.createdAt && new Date(cs.createdAt).getTime() > sevenDaysAgo && cs.sector) {
      recentSectors.add(cs.sector)
    }
  }
  const sortedSectors = Object.entries(sectorCounts).sort((a, b) => a[1] - b[1])
  let underrepresentedSectors = sortedSectors
    .slice(0, Math.min(15, Math.ceil(sortedSectors.length * 0.4)))
    .map(([s]) => s)
  // Mettre les secteurs récents en fin de liste pour varier
  if (recentSectors.size > 0) {
    underrepresentedSectors = [
      ...underrepresentedSectors.filter((s) => !recentSectors.has(s)),
      ...underrepresentedSectors.filter((s) => recentSectors.has(s)),
    ]
  }

  // 2) Types de données les plus utilisés globalement
  const dataTypeCounts = {}
  for (const cs of existingCaseStudies) {
    for (const d of cs.dataExtracted || []) {
      const dn = d.toLowerCase().trim()
      if (dn.length > 3) {
        dataTypeCounts[dn] = (dataTypeCounts[dn] || 0) + 1
      }
    }
  }
  const topDataTypes = Object.entries(dataTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([dt]) => dt)

  // 3) Plateformes les plus utilisées
  const platformCounts = {}
  for (const cs of existingCaseStudies) {
    for (const ex of cs.examples || []) {
      const plat = String(ex).trim()
      if (plat.length >= 2 && plat.length < 50) {
        platformCounts[plat] = (platformCounts[plat] || 0) + 1
      }
    }
  }
  const topPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([p]) => p)

  // 4) Angles à explorer : combinaisons secteur × type de données absentes ou rares
  const sectorDataTypeGaps = []
  for (const sector of underrepresentedSectors) {
    const hasTypes = sectorDataTypes[sector] || new Set()
    for (const dt of topDataTypes.slice(0, 20)) {
      const key = `${sector}|||${dt}`
      const count = dataTypeBySector[key] || 0
      if (count === 0) {
        sectorDataTypeGaps.push({ sector, dataType: dt, reason: 'jamais exploré' })
      } else if (count <= 2) {
        sectorDataTypeGaps.push({ sector, dataType: dt, reason: `seulement ${count} cas` })
      }
    }
  }

  // 5) Angles plateforme × secteur : plateformes populaires pas encore utilisées dans certains secteurs
  const platformSectorGaps = []
  for (const sector of underrepresentedSectors) {
    const hasPlats = sectorPlatforms[sector] || new Set()
    for (const plat of topPlatforms.slice(0, 25)) {
      const key = `${sector}|||${plat}`
      const count = platformBySector[key] || 0
      if (count === 0) {
        platformSectorGaps.push({ sector, platform: plat })
      }
    }
  }

  // Limiter et prioriser les angles les plus pertinents (éviter combos absurdes)
  const anglesSectorDataType = sectorDataTypeGaps
    .filter((g) => g.reason === 'jamais exploré')
    .slice(0, 12)
  const anglesPlatformSector = platformSectorGaps.slice(0, 12)

  return {
    underrepresentedSectors: underrepresentedSectors.slice(0, 12),
    recentSectors: [...recentSectors],
    anglesToExplore: [
      ...anglesSectorDataType.map((g) => `Secteur "${g.sector}" + type de données "${g.dataType}"`),
      ...anglesPlatformSector.map((g) => `Secteur "${g.sector}" + plateforme "${g.platform}"`),
    ].slice(0, 20),
    sectorDataTypeGaps: anglesSectorDataType,
    platformSectorGaps: anglesPlatformSector,
  }
}

// Construire un résumé compact de ce qui existe déjà pour le passer à l'IA
// Stratifié par secteur pour une couverture représentative (évite le biais des 2000 premiers)
function buildKnowledgeSummary(existingCaseStudies, options = {}) {
  const {
    examplePerSector = 3,
    maxExamples = 50,
    maxTitlesToAvoid = 1500,
  } = options

  // Stratifier par secteur : prendre N exemples par secteur pour couvrir la diversité
  const bySector = {}
  for (const cs of existingCaseStudies) {
    const s = cs.sector || 'Autres'
    if (!bySector[s]) bySector[s] = []
    bySector[s].push(cs)
  }

  const stratifiedSample = []
  for (const sector of Object.keys(bySector)) {
    const cases = bySector[sector]
    const shuffled = [...cases].sort(() => Math.random() - 0.5)
    stratifiedSample.push(...shuffled.slice(0, examplePerSector))
  }
  const examples = stratifiedSample.slice(0, maxExamples)

  // Liste exhaustive des titres à éviter (priorité aux récents pour lutter contre la répétition)
  const withCreatedAt = existingCaseStudies.filter((cs) => cs.createdAt)
  const withoutCreatedAt = existingCaseStudies.filter((cs) => !cs.createdAt)
  const recentFirst = [...withCreatedAt].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
  const allTitlesToAvoid = [
    ...recentFirst.map((cs) => cs.title),
    ...withoutCreatedAt.map((cs) => cs.title),
  ].filter(Boolean)

  const titlesToAvoid = allTitlesToAvoid.slice(0, maxTitlesToAvoid)

  // Stats sur TOUTE la base (pas seulement les 2000 premiers)
  const sectorCounts = {}
  const keywordCounts = {}
  const dataCounts = {}

  for (const cs of existingCaseStudies) {
    if (cs.sector) {
      sectorCounts[cs.sector] = (sectorCounts[cs.sector] || 0) + 1
    }
    ;(cs.keywords || []).forEach((k) => {
      const kk = k.toLowerCase()
      keywordCounts[kk] = (keywordCounts[kk] || 0) + 1
    })
    ;(cs.dataExtracted || []).forEach((d) => {
      const dd = d.toLowerCase()
      dataCounts[dd] = (dataCounts[dd] || 0) + 1
    })
  }

  const sortCounts = (obj, limit = 40) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }))

  // Calcul des zones blanches pour guider l'IA
  const gaps = computeGaps(existingCaseStudies)

  return {
    totalCount: existingCaseStudies.length,
    sectors: sortCounts(sectorCounts, 100),
    topKeywords: sortCounts(keywordCounts, 60),
    topDataTypes: sortCounts(dataCounts, 60),
    gaps,
    examples: examples.map((cs) => ({
      slug: cs.slug,
      title: cs.title,
      sector: cs.sector,
      description: cs.description,
      dataExtracted: cs.dataExtracted,
      keywords: cs.keywords,
      examples: cs.examples,
    })),
    titlesToAvoid,
  }
}

// ========== FLUX MULTI-AGENTS : Explorer → Critic → Builder ==========

async function callOpenAI(messages, options = {}) {
  const { model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 4000, retries = 2, timeout: timeoutMs = 90000 } = options
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquant')

  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 3000 // 3s, 6s
      console.log(`[callOpenAI] Retry ${attempt}/${retries} dans ${delay / 1000}s...`)
      await new Promise((r) => setTimeout(r, delay))
    }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      let response
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ model, temperature, max_tokens, messages }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const msg = err.error?.message || `OpenAI ${response.status}`
        // 429 / 5xx : retryable
        if ((response.status === 429 || response.status >= 500) && attempt < retries) {
          lastError = new Error(msg)
          continue
        }
        throw new Error(msg)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content?.trim() || ''
    } catch (e) {
      if (e.name === 'AbortError') {
        lastError = new Error(`OpenAI timeout (${timeoutMs / 1000}s)`)
      } else {
        lastError = e
      }
      if (attempt < retries) continue
    }
  }
  throw lastError
}

// AGENT 1 - EXPLORER : Génère des idées en 2 parties
// - Partie A (obligatoire) : une idée par top opportunité Search Console
// - Partie B (créative) : idées libres pour diversifier
async function agentExploreIdeas(summary, options = {}) {
  const { forceNiche = false } = options
  const titlesSample = (summary.titlesToAvoid || []).slice(0, 500).join('\n')
  const sc = summary.searchConsole || {}

  // Utiliser les clusters si disponibles, sinon fallback sur queriesToTarget
  const rawClusters = sc.hasData ? (sc.clusteredOpportunities || []) : []
  // Si pas de clusters (ancienne version SC), construire des clusters fictifs depuis queriesToTarget
  const topClusters = rawClusters.length > 0
    ? rawClusters.slice(0, 12)
    : (sc.queriesToTarget || []).slice(0, 12).map((q) => ({ mainQuery: q.query, variants: [q.query], impressions: q.impressions, clicks: q.clicks || 0, position: q.position, score: q.score }))

  const toAvoid = sc.hasData ? (sc.queriesWeRankFor || []).slice(0, 120).join(', ') : ''
  const perfSectors = sc.hasData ? (sc.performingSectors || []).slice(0, 5).join(', ') : ''

  const partieA_count = topClusters.length
  const partieB_count = Math.max(8, 20 - partieA_count)

  let prompt

  if (sc.hasData && topClusters.length > 0 && !forceNiche) {
    // Mode Search Console : partie A obligatoire (clusters) + partie B créative
    const clustersFormatted = topClusters.map((c, i) => {
      const variantsStr = c.variants.length > 1 ? ` (variantes: ${c.variants.slice(1).join(', ')})` : ''
      const rankWarning = c.hasStrongRanking
        ? ` ⚠️ DÉJÀ EN POS ${c.strongRankingPosition} — propose un angle COMPLÉMENTAIRE (ne pas cannibaliser)`
        : ''
      return `  ${i + 1}. requête: "${c.mainQuery}"${variantsStr} | pos ${Math.round(c.position)} | ${c.impressions} imp | ${c.clicks || 0} clics${rankWarning}`
    }).join('\n')

    prompt = `Tu es un expert SEO et scraping. Tu dois générer des idées de cas d'usage scraping en 2 parties.

TITRES EXISTANTS (à ne pas dupliquer) :
${titlesSample.slice(0, 6000)}

REQUÊTES DÉJÀ COUVERTES (ne pas cannibaliser) : ${toAvoid || 'aucune'}
SECTEURS PERFORMANTS (priorité) : ${perfSectors || 'aucun'}
SECTEURS RÉCENTS À DIVERSIFIER : ${(summary.gaps?.recentSectors || []).join(', ') || 'aucun'}

━━━ PARTIE A — ${partieA_count} CAS OBLIGATOIRES (un par cluster Search Console) ━━━
Pour CHAQUE cluster ci-dessous, propose UN cas d'usage qui cible la requête principale ET ses variantes.
La page générée doit ranker sur toutes les variantes du cluster (même intention, angles complémentaires).
Exemples de mapping :
- cluster "idealo scraper" + variantes "idealo scraping", "scrape idealo" → "Scraping Idealo : suivi automatique des prix concurrents" (la page cible les 3 requêtes)
- cluster "scraping pages jaunes" + variante "extraction pages jaunes" → "Scraping PagesJaunes : extraction des leads locaux"
- cluster "scraping des adresses mail" → "Scraping d'emails : collecte automatisée de contacts B2B"

CLUSTERS À COUVRIR (requête principale + variantes) :
${clustersFormatted}

━━━ PARTIE B — ${partieB_count} CAS CRÉATIFS (idées libres) ━━━
Propose ${partieB_count} idées supplémentaires diversifiées :
- Secteurs sous-représentés : ${(summary.gaps?.underrepresentedSectors || []).join(', ')}
- Plateformes NICHE concrètes (pas que les mainstream)
- Angles originaux (leads, veille prix, automatisation, juridique, santé, etc.)

FORMAT — Réponds UNIQUEMENT par un JSON valide :
{
  "ideas": [
    { "title": "Scraping X : ...", "platform": "X", "sector": "Secteur", "angle": "résumé 5 mots", "scQuery": "requête principale SC ciblée ou null", "scVariants": ["variante1", "variante2"] ou [], "whyOriginal": "en quoi c'est utile" },
    ...
  ]
}
Les ${partieA_count} premières idées = Partie A (une par cluster SC dans l'ordre). Les suivantes = Partie B.`

  } else {
    // Mode sans SC ou retry niche
    prompt = `Tu es un expert SEO et scraping. Propose 20 idées de cas d'usage scraping.

TITRES EXISTANTS (à ne pas dupliquer) :
${titlesSample.slice(0, 8000)}

SECTEURS SOUS-REPRÉSENTÉS : ${(summary.gaps?.underrepresentedSectors || []).join(', ')}
SECTEURS RÉCENTS À DIVERSIFIER : ${(summary.gaps?.recentSectors || []).join(', ') || 'aucun'}

${forceNiche ? `MODE NICHE OBLIGATOIRE : propose UNIQUEMENT des plateformes ultra-spécifiques et sectorielles
(ex: Doctolib, Médiapart, SeLoger, Gens de Confiance, Cadremploi, L'Étudiant, Auto-Journal,
Kelquartier, Meilleurs Agents, Kompass, Leboncoin, PagesJaunes, Societe.com, Infogreffe).
AUCUNE plateforme mainstream (LinkedIn, Twitter/X, Amazon, Facebook, TikTok).` : `Varie les secteurs et plateformes, pense aux plateformes NICHE.`}

FORMAT — Réponds UNIQUEMENT par un JSON valide :
{
  "ideas": [
    { "title": "Scraping X : ...", "platform": "X", "sector": "Secteur", "angle": "résumé 5 mots", "scQuery": null, "whyOriginal": "en quoi c'est utile" },
    ...
  ]
}
20 idées exactement.`
  }

  const content = await callOpenAI(
    [
      { role: 'system', content: 'Tu es un expert en scraping et SEO. Tu réponds UNIQUEMENT en JSON valide, sans texte autour.' },
      { role: 'user', content: prompt },
    ],
    { temperature: sc.hasData && !forceNiche ? 0.6 : 0.85, max_tokens: 3000 },
  )

  const cleanContent = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  try {
    const parsed = JSON.parse(cleanContent)
    const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : []
    // Log le mapping SC pour vérification
    if (sc.hasData && topClusters.length > 0) {
      const mapped = ideas.slice(0, partieA_count).map((idea, idx) => {
        const cluster = topClusters[idx]
        const variantsStr = cluster?.variants?.length > 1 ? ` [+${cluster.variants.length - 1} variantes]` : ''
        const rankFlag = cluster?.hasStrongRanking ? ` ⚠️ pos ${cluster.strongRankingPosition}` : ''
        return `  ${idx + 1}. "${cluster?.mainQuery}"${variantsStr}${rankFlag} → "${idea.title}"`
      }).join('\n')
      console.log(`[agentExploreIdeas] Mapping SC → idées (Partie A) :\n${mapped}`)
    }
    return ideas
  } catch (e) {
    console.error('[agentExploreIdeas] Parse error:', e.message)
    return []
  }
}

// AGENT 2 - CRITIC : Évalue, ranke, suggère des améliorations
async function agentCriticReview(ideas, summary) {
  const titlesSample = (summary.titlesToAvoid || []).slice(0, 300).join('\n')
  const sc = summary.searchConsole || {}

  let scContext = ''
  if (sc.hasData) {
    const opps = (sc.queriesToTarget || []).slice(0, 35).map((q) => q.query).join(', ')
    scContext = `
DONNÉES SEARCH CONSOLE :
- Secteurs performants (privilégie) : ${(sc.performingSectors || []).join(', ')}
- Opportunités (requêtes réelles à cibler) : ${opps || 'aucune'}
- Bonus potentielSEO si l'idée cible une de ces opportunités (demande réelle = volume garanti).
`
  }

  const prompt = `Tu es un CRITIQUE SEO exigeant. Tu reçois des idées de cas d'usage générées en 2 parties et tu dois les évaluer.

IDÉES REÇUES (index = position dans la liste, 0-based) :
${JSON.stringify(ideas.map((i, idx) => ({ index: idx, title: i.title, sector: i.sector, scQuery: i.scQuery || null, whyOriginal: i.whyOriginal })), null, 2)}
${scContext}
TITRES EXISTANTS (échantillon - éviter les doublons) :
${titlesSample.slice(0, 6000)}

Pour chaque idée, évalue :
1. originalité (1-10) : vraiment nouveau ou variante d'existant ?
2. potentielSEO (1-10) : volume recherche estimé ${sc.hasData ? '— +3 AUTOMATIQUE si l\'idée a un champ "scQuery" non null (demande réelle prouvée par Search Console)' : ''}
3. intentionCommerciale (1-10) : 10 = prospect prêt à payer, 1 = curiosité
4. lethality (1-10) : douleur concrète, gain mesurable, urgence business
5. risqueDoublon (1-10) : 10 = doublon évident, 1 = totalement unique

RÈGLE IMPORTANTE : Les idées avec "scQuery" non null ont une demande RÉELLE prouvée → leur potentielSEO est garanti. Intègre-les TOUTES dans la sélection finale sauf si risqueDoublon ≥ 8.

Retourne les 8-10 MEILLEURES idées (en incluant obligatoirement les idées avec scQuery non null).

Réponds UNIQUEMENT par un JSON valide :
{
  "selected": [
    { "index": 0, "title": "...", "originalite": 8, "potentielSEO": 7, "intentionCommerciale": 8, "lethality": 9, "risqueDoublon": 2, "suggestion": "optionnel : préciser X pour renforcer" },
    ...
  ]
}`

  const content = await callOpenAI(
    [
      { role: 'system', content: 'Tu es un critique SEO. Tu réponds UNIQUEMENT en JSON valide.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.3, max_tokens: 2000 },
  )

  const cleanContent = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  let parsed
  try {
    parsed = JSON.parse(cleanContent)
  } catch (e) {
    throw new Error(`Agent Critic parse error: ${e.message}`)
  }
  const selected = (parsed.selected || []).slice(0, 10)
  return selected
    .filter((s) => typeof s.index === 'number' && ideas[s.index])
    .map((s) => ({
      ...ideas[s.index],
      ...s,
      title: s.title || ideas[s.index]?.title,
    }))
}

// Tente de réparer un JSON mal formé (guillemets non échappés, newlines littéraux, trailing commas)
function repairJSON(str) {
  if (!str) return str
  let s = str.trim()

  // Supprimer les trailing commas avant } ou ]
  s = s.replace(/,(\s*[}\]])/g, '$1')

  // Remplacer les newlines littéraux à l'intérieur des valeurs de chaîne JSON par \n
  // On parcourt caractère par caractère pour identifier les strings JSON et nettoyer leur contenu
  let result = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (escaped) {
      result += ch
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      result += ch
      continue
    }
    if (ch === '"') {
      inString = !inString
      result += ch
      continue
    }
    if (inString) {
      // Newline ou retour chariot littéral dans une string JSON → échapper
      if (ch === '\n') { result += '\\n'; continue }
      if (ch === '\r') { result += '\\r'; continue }
      if (ch === '\t') { result += '\\t'; continue }
    }
    result += ch
  }

  return result
}

// AGENT 3 - BUILDER : Développe les idées sélectionnées en cas d'usage complets
async function agentBuildCases(selectedIdeas, summary, count) {
  const titlesListText =
    summary.titlesToAvoid && summary.titlesToAvoid.length > 0
      ? summary.titlesToAvoid.slice(0, 1200).join('\n')
      : ''

  const ideasForBuilder = selectedIdeas.slice(0, count).map((i) => ({
    title: i.title,
    platform: i.platform,
    sector: i.sector,
    angle: i.angle,
    suggestion: i.suggestion,
    scQuery: i.scQuery || null,
    scVariants: i.scVariants || [],
  }))

  const prompt = `Tu es un RÉDACTEUR expert B2B. Tu développes des cas d'usage SCRAPING qui doivent être ULTRA LÉTHAUX : le prospect se dit "c'est exactement mon problème" et veut en savoir plus.

IDÉES À DÉVELOPPER (sélectionnées pour intention commerciale + potentiel conversion) :
${JSON.stringify(ideasForBuilder, null, 2)}

Titres existants à ne pas dupliquer :
${titlesListText.slice(0, 4000)}

CHECKLIST OBLIGATOIRE pour chaque cas :
1. painPoint : douleur concrète, chiffrée ("X heures perdues par semaine", "Y leads non exploités")
2. useCase : MINIMUM 400 MOTS. Structure obligatoire :
   - Accroche (ROI/gain de temps dans les 50 premiers mots)
   - Problème détaillé (1-2 paragraphes avec exemples concrets)
   - Ce qu'on peut scraper exactement (données précises)
   - Cas d'usage business concrets (2-3 exemples chiffrés)
   - Pour qui c'est fait (profils ICP : agences, commerciaux, data analysts...)
   - Si le cas a des scVariants, intègre ces termes naturellement dans le texte pour ranker sur les variantes
3. keywords : 6-10 mots-clés SEO incluant les scVariants si présents
4. dataExample : au moins 3 colonnes et 4 lignes de données réalistes

FORMAT - JSON strict :
{
  "cases": [
    {
      "slug": "slug-url",
      "sector": "Secteur",
      "title": "Scraping [Platform] : [angle]",
      "description": "2-3 phrases percutantes avec pain point en tête",
      "useCase": "MINIMUM 300 MOTS. Texte structuré en paragraphes (pas de markdown, texte brut).",
      "painPoint": "Phrase percutante chiffrée",
      "personalized": {
        "whyUseCase": { "problemsSolved": "problème résolu en détail", "concreteExamples": "2-3 exemples très concrets", "businessImpact": "impact business chiffré" },
        "benefits": { "intro": "paragraphe d'intro sur les bénéfices" },
        "dataExample": { "columns": ["Col1","Col2","Col3"], "sampleRows": [["v1","v2","v3"],["v1","v2","v3"],["v1","v2","v3"],["v1","v2","v3"]], "hasContactData": false }
      },
      "dataExtracted": ["Type 1", "Type 2", "Type 3", "Type 4"],
      "benefits": ["Bénéfice 1 chiffré", "Bénéfice 2 concret", "Bénéfice 3", "Bénéfice 4"],
      "examples": ["Plateforme principale"],
      "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5", "mot-clé 6"],
      "faq": [
        { "question": "Question concrète que se pose un prospect (ex: Est-ce légal de scraper X ?)", "answer": "Réponse directe et utile en 2-4 phrases." },
        { "question": "Question technique ou business (ex: Combien de données peut-on extraire ?)", "answer": "Réponse avec chiffres ou exemples concrets." },
        { "question": "Question sur les bénéfices (ex: Qui utilise ce type de scraping ?)", "answer": "Réponse orientée ICP." }
      ],
      "attractivenessScore": 7,
      "attractivenessReason": "..."
    }
  ]
}

Règles FAQ : 3 à 5 questions. Les questions doivent reprendre les mots-clés du champ keywords pour être éligibles aux featured snippets Google. Réponses courtes et directes (2-4 phrases max).

Développe exactement ${ideasForBuilder.length} cas, en français, B2B orienté conversion. useCase = minimum 300 mots.`

  const content = await callOpenAI(
    [
      { role: 'system', content: "Tu rédiges des cas d'usage scraping en français. JSON valide uniquement, pas de ```. Le champ useCase doit faire MINIMUM 300 mots." },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.6, max_tokens: 6500, retries: 3, timeout: 150000 },
  )

  const rawContent = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  const cleanContent = repairJSON(rawContent)
  try {
    const parsed = JSON.parse(cleanContent)
    return Array.isArray(parsed.cases) ? parsed.cases : []
  } catch (e) {
    throw new Error(`Agent Builder parse error: ${e.message}`)
  }
}

// Appel OpenAI pour générer N nouveaux cas d'usage via le flux multi-agents
// excludeQueries : requêtes déjà passées au run précédent (éviter de retomber sur les mêmes)
async function generateNewCaseStudies(existingCaseStudies, count, excludeQueries = [], options = {}) {
  const { forceNiche = false } = options
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquant')
  }

  const summary = buildKnowledgeSummary(existingCaseStudies)

  // Données Search Console : exclure les requêtes déjà traitées au run précédent
  let searchConsole = { hasData: false }
  try {
    searchConsole = await getSearchConsoleData({
      days: 90,
      queriesLimit: 500,
      pagesLimit: 200,
      excludeQueries,
    })
    if (searchConsole.hasData) {
      const excluded = excludeQueries.length
      const opps = searchConsole.queriesToTarget || []
      console.log(
        `[generate-new-case-studies] Search Console : ${opps.length} opportunités` +
          (excluded ? ` (${excluded} exclues du run précédent)` : '') +
          `, ${searchConsole.queriesWeRankFor.length} requêtes couvertes, ` +
          `secteurs performants: ${(searchConsole.performingSectors || []).slice(0, 5).join(', ')}`,
      )
      if (opps.length > 0) {
        console.log('[generate-new-case-studies] Liste des opportunités (query | position | impressions | clics) :')
        opps.forEach((q, i) => {
          console.log(
            `  ${String(i + 1).padStart(3)}. "${q.query}" | pos ${Math.round(q.position)} | ${q.impressions || 0} imp | ${q.clicks || 0} clics`,
          )
        })
      }
    } else {
      console.log(
        '[generate-new-case-studies] Search Console : aucune donnée (vérifier GOOGLE_SERVICE_ACCOUNT_KEY ou service-account-key.json + propriété du site dans Search Console)',
      )
    }
  } catch (e) {
    console.warn('[generate-new-case-studies] Search Console erreur:', e.message)
  }
  summary.searchConsole = searchConsole
  const titlesSet = new Set(
    existingCaseStudies
      .filter((cs) => cs.title)
      .map((cs) => cs.title.toLowerCase().trim()),
  )

  // Agent 1 : Explorer - 20 idées variées (ou consigne niche si retry)
  const passeLabel = forceNiche ? 'passe 2 (niche)' : 'passe 1'
  console.log(`[generate-new-case-studies] Agent 1 (Explorer) : génération de 20 idées... [${passeLabel}]`)
  let ideas = []
  try {
    ideas = await agentExploreIdeas(summary, { forceNiche })
    console.log(`[generate-new-case-studies] Agent 1 : ${ideas.length} idées générées [${passeLabel}]`)
  } catch (e) {
    console.error('[generate-new-case-studies] Agent 1 erreur:', e.message)
    throw e
  }

  if (ideas.length < 5) {
    throw new Error('Agent Explorer n\'a pas généré assez d\'idées')
  }

  // Agent 2 : Critic - évalue et sélectionne les meilleures
  console.log('[generate-new-case-studies] Agent 2 (Critic) : évaluation et sélection...')
  let selectedIdeas = []
  try {
    selectedIdeas = await agentCriticReview(ideas, summary)
    console.log(
      `[generate-new-case-studies] Agent 2 : ${selectedIdeas.length} idées sélectionnées`,
      selectedIdeas.slice(0, 3).map((i) => i.title),
    )
  } catch (e) {
    console.warn('[generate-new-case-studies] Agent 2 erreur, fallback sur toutes les idées:', e.message)
    selectedIdeas = ideas.slice(0, count + 2).map((i, idx) => ({ ...i, index: idx }))
  }

  if (selectedIdeas.length === 0) {
    console.warn('[generate-new-case-studies] Agent 2 : aucune idée valide, fallback sur les premières idées')
    selectedIdeas = ideas.slice(0, count + 2).map((i, idx) => ({ ...i, index: idx }))
  }

  // Agent 3 : Builder - développe les cas complets (limité à count+2 pour tenir dans le timeout)
  // Passe 2 (forceNiche) : max 3 cas pour éviter timeout quand le flux fait 2 passes complètes
  const maxForPass = forceNiche ? 3 : count + 2
  const toBuild = Math.min(maxForPass, selectedIdeas.length)
  console.log(`[generate-new-case-studies] Agent 3 (Builder) : développement de ${toBuild} cas complets...`)
  let cases = []
  try {
    cases = await agentBuildCases(selectedIdeas, summary, toBuild)
    console.log(`[generate-new-case-studies] Agent 3 : ${cases.length} cas développés`)
  } catch (e) {
    console.error('[generate-new-case-studies] Agent 3 erreur:', e.message)
    throw e
  }

  if (!Array.isArray(cases) || cases.length === 0) {
    throw new Error('Agent Builder n\'a pas produit de cas')
  }

  const scoresPreview = cases.slice(0, 5).map((c) => ({
    title: c.title,
    score: c.attractivenessScore,
  }))
  console.log('[generate-new-case-studies] Cas produits (preview):', scoresPreview)

  // Construire la map query → toutes ses variantes (pour consommer tout le cluster d'un coup)
  const clusterVariantsMap = {}
  if (searchConsole.hasData) {
    for (const cluster of (searchConsole.clusteredOpportunities || [])) {
      for (const variant of cluster.variants || []) {
        clusterVariantsMap[cluster.mainQuery] = cluster.variants
        clusterVariantsMap[variant] = cluster.variants
      }
    }
  }

  return {
    generatedRaw: cases,
    existingTitlesSet: titlesSet,
    queriesPassed: searchConsole.hasData ? searchConsole.queriesToTarget.map((q) => q.query) : [],
    clusterVariantsMap,
  }
}

// Rejeter les cas trop génériques (sans plateforme concrète)
// Ex: "Scraping Médias : ..." ou "Scraping Finance : ..." = secteurs, pas des plateformes
const SECTOR_NAMES_FOR_VALIDATION = new Set([
  'immobilier', 'artisanat', 'santé', 'sante', 'finance', 'e-commerce', 'restauration',
  'éducation', 'education', 'sport', 'loisirs', 'beauté', 'beaute', 'bien-être',
  'automobile', 'hotellerie', 'juridique', 'transport', 'logistique', 'tourisme',
  'voyage', 'automatisation', 'developpement', 'medias', 'médias', 'actualités',
  'recrutement', 'rh', 'reseaux', 'sociaux', 'seo', 'analytics', 'autres', 'ia',
  'machine', 'learning',
])
function isGenericCaseStudy(raw) {
  const title = (raw?.title || '').toLowerCase()
  const examples = raw?.examples || []
  const match = title.match(/^scraping\s+([^:]+)\s*:/)
  if (!match) return false
  const afterScraping = match[1].trim().replace(/\s+&\s+.*$/, '') // "Médias & Actualités" -> "Médias"
  const firstWord = afterScraping.split(/\s+/)[0] || afterScraping
  if (SECTOR_NAMES_FOR_VALIDATION.has(firstWord)) {
    return { generic: true, reason: `titre générique "Scraping ${firstWord}..." sans plateforme concrète` }
  }
  if (examples.length === 0 || examples.every((e) => !e || String(e).length < 3)) {
    return { generic: true, reason: 'aucune plateforme dans le champ examples' }
  }
  return { generic: false }
}

// Validation minimale + harmonisation de la structure
function normalizeGeneratedCaseStudy(raw, existingSlugs) {
  if (!raw || !raw.title || !raw.description) {
    throw new Error('Cas généré invalide (titre/description manquants)')
  }

  let slug = raw.slug || slugify(raw.title)
  if (!slug) {
    slug = slugify(raw.title)
  }

  // Éviter les collisions de slugs (suffixes -2, -3, ...)
  const baseSlug = slug
  let counter = 2
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`
    counter += 1
  }

  // Normaliser quelques champs
  const sector = raw.sector || 'Autres'
  const dataExtracted = Array.isArray(raw.dataExtracted) ? raw.dataExtracted : []
  const benefits = Array.isArray(raw.benefits) ? raw.benefits : []
  const examples = Array.isArray(raw.examples) ? raw.examples : []
  const keywords = Array.isArray(raw.keywords) ? raw.keywords : []
  const attractivenessScore =
    typeof raw.attractivenessScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(raw.attractivenessScore)))
      : null
  const attractivenessReason =
    typeof raw.attractivenessReason === 'string' ? raw.attractivenessReason : null
  const createdAt =
    typeof raw.createdAt === 'string' && raw.createdAt
      ? raw.createdAt
      : new Date().toISOString()
  const generated = raw.generated === false ? false : true

  // Données personnalisées pour conversion (whyUseCase, dataExample, benefits.intro)
  let personalized = null
  if (raw.personalized && typeof raw.personalized === 'object') {
    const p = raw.personalized
    if (p.whyUseCase || p.dataExample) {
      personalized = {
        whyUseCase: p.whyUseCase || null,
        benefits: p.benefits || null,
        dataExample: p.dataExample || null,
        hasContactData: Boolean(p.hasContactData),
      }
    }
  }

  // FAQ pour featured snippets Google
  const faq = Array.isArray(raw.faq)
    ? raw.faq
        .filter((item) => item && typeof item.question === 'string' && typeof item.answer === 'string')
        .slice(0, 5)
    : []

  return {
    slug,
    sector,
    title: raw.title,
    description: raw.description,
    useCase: raw.useCase || '',
    painPoint: typeof raw.painPoint === 'string' ? raw.painPoint : null,
    dataExtracted,
    benefits,
    examples,
    keywords,
    faq: faq.length > 0 ? faq : undefined,
    createdAt,
    generated,
    attractivenessScore,
    attractivenessReason,
    personalized: personalized || undefined,
  }
}

// Vérifier que les mots-clés Search Console sont présents dans le contenu généré
function checkKeywordCoverage(cs) {
  const fullText = [
    cs.title || '',
    cs.useCase || '',
    cs.subtitle || '',
    (cs.keywords || []).join(' '),
    (cs.scVariants || []).join(' '),
  ].join(' ').toLowerCase()

  const mainQuery = (cs.scQuery || '').toLowerCase().trim()
  const mainQueryPresent = mainQuery.length === 0 || fullText.includes(mainQuery)

  const variants = (cs.scVariants || [])
  let variantsFound = 0
  for (const v of variants) {
    if (fullText.includes(v.toLowerCase().trim())) variantsFound++
  }
  const coveragePct = variants.length > 0
    ? Math.round((variantsFound / variants.length) * 100)
    : (mainQueryPresent ? 100 : 0)

  return { mainQueryPresent, coveragePct, variantsFound, variantsTotal: variants.length }
}

// Trouver les N cas les plus proches pour le maillage interne
// Critères : même secteur + overlap mots-clés + similarité titre
function findRelatedCases(newCase, existingCases, n = 4) {
  const newKeywords = new Set((newCase.keywords || []).map((k) => k.toLowerCase().trim()))
  const newSector = (newCase.sector || '').toLowerCase()
  const newTitleWords = new Set(tokenizeForSimilarity(newCase.title || ''))

  const scored = []
  for (const existing of existingCases) {
    if (existing.slug === newCase.slug) continue

    let score = 0

    // Bonus secteur identique
    const existingSector = (existing.sector || '').toLowerCase()
    if (existingSector === newSector) score += 3

    // Overlap mots-clés
    const existingKeywords = new Set((existing.keywords || []).map((k) => k.toLowerCase().trim()))
    let kwOverlap = 0
    for (const k of newKeywords) {
      if (existingKeywords.has(k)) kwOverlap++
    }
    if (kwOverlap > 0) score += kwOverlap * 2

    // Similarité titre (Jaccard)
    const existingTitleWords = new Set(tokenizeForSimilarity(existing.title || ''))
    let titleInter = 0
    for (const w of newTitleWords) {
      if (existingTitleWords.has(w)) titleInter++
    }
    const titleUnion = newTitleWords.size + existingTitleWords.size - titleInter
    if (titleUnion > 0) score += (titleInter / titleUnion) * 5

    if (score > 0) {
      scored.push({ slug: existing.slug, title: existing.title, sector: existing.sector, score })
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ slug, title, sector }) => ({ slug, title, sector }))
}

export default async function handler(req, res) {
  // Méthode
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Sécurité : même mécanique que case-studies-sync
  if (process.env.CRON_SECRET) {
    const auth = req.headers.authorization
    if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY manquant côté serveur' })
  }

  const maxPerRun = Number(process.env.CASE_STUDIES_PER_RUN || 8)

  try {
    // 1) Charger le blob existant, ou reconstruire depuis local
    const blobResult = await loadBlobData()
    let blobData
    if (blobResult && blobResult.data) {
      blobData = blobResult.data
    } else {
      blobData = buildBlobFromLocal()
    }

    const existingCaseStudies = blobData.caseStudies || []
    const existingSlugs = new Set(existingCaseStudies.map((cs) => cs.slug))
    const existingTitles = new Set(
      existingCaseStudies
        .filter((cs) => cs.title)
        .map((cs) => cs.title.toLowerCase().trim()),
    )

    // 2) Charger les requêtes déjà traitées au run précédent (éviter répétition)
    const scState = await loadSearchConsoleState()

    // Valide et filtre un lot de cas bruts — mute existingCaseStudies, existingSlugs, existingTitles
    async function processBatch(generatedRaw, batchLabel) {
      const accepted = []
      const rejectedLog = []
      for (const raw of generatedRaw) {
        try {
          const titleNorm = (raw.title || '').toLowerCase().trim()
          if (!titleNorm) continue

          if (existingTitles.has(titleNorm)) {
            const r = `titre exact déjà existant`
            console.log(`[generate-new-case-studies] [${batchLabel}] Ignoré (titre exact): ${raw.title}`)
            rejectedLog.push({ title: raw.title, reason: r })
            continue
          }

          const genericCheck = isGenericCaseStudy(raw)
          if (genericCheck.generic) {
            console.log(`[generate-new-case-studies] [${batchLabel}] Ignoré (trop générique): ${raw.title} - ${genericCheck.reason}`)
            rejectedLog.push({ title: raw.title, reason: genericCheck.reason })
            continue
          }

          const normalized = normalizeGeneratedCaseStudy(raw, existingSlugs)

          const { reject, reason } = await shouldRejectCase(normalized, existingCaseStudies)
          if (reject) {
            console.log(`[generate-new-case-studies] [${batchLabel}] Ignoré: ${raw.title} - ${reason}`)
            rejectedLog.push({ title: raw.title, reason })
            continue
          }

          // Vérification présence mots-clés SC dans le texte généré
          if (normalized.scQuery) {
            normalized.keywordCoverage = checkKeywordCoverage(normalized)
            if (!normalized.keywordCoverage.mainQueryPresent) {
              console.warn(
                `[generate-new-case-studies] ⚠️ Mot-clé SC "${normalized.scQuery}" absent du texte — couverture: ${normalized.keywordCoverage.coveragePct}%`
              )
            }
          }

          // Maillage interne : trouver les 4 cas les plus proches thématiquement
          normalized.relatedLinks = findRelatedCases(normalized, existingCaseStudies, 4)

          existingCaseStudies.push(normalized)
          existingSlugs.add(normalized.slug)
          existingTitles.add(titleNorm)
          accepted.push(normalized)
        } catch (error) {
          console.error(`[generate-new-case-studies] [${batchLabel}] Erreur de normalisation:`, error.message)
        }
      }
      return { accepted, rejectedLog }
    }

    // 3) Passe 1 : génération principale
    const { generatedRaw: raw1, queriesPassed, clusterVariantsMap } = await generateNewCaseStudies(
      existingCaseStudies,
      maxPerRun,
      scState.lastTargetedQueries,
    )
    const { accepted: pass1, rejectedLog: rejected1 } = await processBatch(raw1, 'passe 1')
    const generated = [...pass1]
    const allRejected = [...rejected1]

    // 4) Retry automatique si < 3 cas acceptés — Explorer avec consigne "plateformes niche"
    if (generated.length < 3) {
      console.log(`[generate-new-case-studies] Passe 1 : seulement ${generated.length} cas acceptés — retry (passe 2) avec consigne niche...`)
      try {
        const { generatedRaw: raw2 } = await generateNewCaseStudies(
          existingCaseStudies,
          maxPerRun,
          scState.lastTargetedQueries,
          { forceNiche: true },
        )
        const { accepted: pass2, rejectedLog: rejected2 } = await processBatch(raw2, 'passe 2')
        generated.push(...pass2)
        allRejected.push(...rejected2)
        console.log(`[generate-new-case-studies] Passe 2 : ${pass2.length} cas supplémentaires acceptés`)
      } catch (e) {
        console.warn('[generate-new-case-studies] Passe 2 erreur:', e.message)
      }
    }

    console.log(`[generate-new-case-studies] Résumé : ${generated.length} acceptés, ${allRejected.length} rejetés`)
    if (allRejected.length > 0) {
      console.log('[generate-new-case-studies] Rejetés :', allRejected.map((r) => `"${r.title}" → ${r.reason}`).join(' | '))
    }

    if (generated.length === 0) {
      await saveSearchConsoleState([])
      return res.status(200).json({
        ok: true,
        added: 0,
        total: existingCaseStudies.length,
        generated: [],
        rejected: allRejected.length,
        message: 'Aucun nouveau cas suffisamment original (doublons ou similaires détectés après 2 passes). Réessayer lors de la prochaine exécution.',
      })
    }

    // 3) Mettre à jour le blob (index + per-slug + full pour crons)
    blobData.caseStudies = existingCaseStudies
    blobData.count = existingCaseStudies.length
    blobData.lastUpdated = new Date().toISOString()

    await putCaseStudiesSplit(existingCaseStudies, { skipFull: false })

    console.log(
      `[generate-new-case-studies] ${generated.length} nouveaux cas d'usage ajoutés. Total: ${existingCaseStudies.length}`,
    )

    // Exclure les requêtes qui ont servi + toutes les variantes de leur cluster
    const matches = await findMatchingQueriesWithLLM(generated, queriesPassed)
    const matchedQueries = [...new Set(matches.values())]
    // Étendre avec les variantes de cluster pour éviter de retraiter le même sujet
    const allQueriesToConsume = new Set(matchedQueries)
    for (const q of matchedQueries) {
      const variants = clusterVariantsMap?.[q] || []
      for (const v of variants) allQueriesToConsume.add(v)
    }
    const queriesUsed = [...allQueriesToConsume]
    await saveSearchConsoleState(queriesUsed)
    if (queriesUsed.length > 0) {
      console.log(`[generate-new-case-studies] Requêtes SC "consommées" (+ variantes): ${queriesUsed.join(', ')}`)
    }

    // Notification Telegram (optionnelle)
    try {
      await sendTelegramNotification(generated, {
        rejectedCount: allRejected.length,
        scOpportunities: queriesPassed.length,
        isRetry: generated.some((_, i) => i >= pass1.length),
        totalCases: existingCaseStudies.length,
      })
    } catch (e) {
      console.warn(
        '[generate-new-case-studies] Erreur lors de la notification Telegram:',
        e.message,
      )
    }

    return res.status(200).json({
      ok: true,
      added: generated.length,
      rejected: allRejected.length,
      passes: generated.length > pass1.length ? 2 : 1,
      total: existingCaseStudies.length,
      generated: generated.map((g) => ({
        slug: g.slug,
        title: g.title,
        sector: g.sector,
      })),
      lastUpdated: blobData.lastUpdated,
    })
  } catch (error) {
    console.error('[generate-new-case-studies] Erreur:', error)
    return res.status(500).json({ error: error.message || 'Erreur inconnue' })
  }
}

// Passe 2 (forceNiche) double la charge → Agent 3 doit être plus léger pour rester sous le timeout
export const config = {
  maxDuration: 600, // Pro/Enterprise: jusqu'à 800s. Hobby: 300s max (optimisation toBuild en passe 2 compensera).
}

