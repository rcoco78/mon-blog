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
import { caseStudies as localCaseStudies } from '../../../lib/case-studies'
import { siteConfig } from '../../../lib/config'
import { sectorToSlug } from '../../../lib/case-studies-helpers'

const BLOB_FILENAME = 'case-studies.json'

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
async function sendTelegramNotification(newCases) {
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

  const text =
    `🆕 *Nouveaux cas d'usage générés automatiquement*\n\n` +
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

Exemples de cas à ACCEPTER (pas doublon) :
- "TikTok vidéos de voyage" vs "TikTok vidéos par son" → angles différents
- "LinkedIn profils recruteurs" vs "LinkedIn publications de profils" → use cases différents
- "TripAdvisor avis restaurants" vs "TripAdvisor avis hôtels" → niches différentes

Exemples de cas à REJETER (vrai doublon) :
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
// Zones : score < 0.40 = accept | 0.40-0.75 = IA décide | >= 0.75 = reject
async function shouldRejectCase(newCase, existingCases) {
  const candidates = findSimilarCandidates(newCase, existingCases)
  const best = candidates[0]

  if (!best || best.score < 0.40) {
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
  const { model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 4000 } = options
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquant')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

// AGENT 1 - EXPLORER : Génère 15 idées variées, créatives, diversifiées
async function agentExploreIdeas(summary) {
  const titlesSample = (summary.titlesToAvoid || []).slice(0, 500).join('\n')
  const prompt = `Tu es un EXPLORATEUR créatif. Ta mission : proposer 15 IDÉES de cas d'usage de scraping (pas les développer, juste les idées).

CONTEXTE :
- Secteurs sous-représentés : ${(summary.gaps?.underrepresentedSectors || []).join(', ')}
- Secteurs déjà générés récemment (7j) — À DIVERSIFIER, ne pas en proposer plus de 2 : ${(summary.gaps?.recentSectors || []).join(', ') || 'aucun'}
- Angles à explorer : ${(summary.gaps?.anglesToExplore || []).slice(0, 10).join(' | ')}
- Exemples de titres existants (à NE PAS répéter) :
${titlesSample.slice(0, 8000)}

CONSIGNES :
1. DIVERSITÉ MAXIMALE : varie les secteurs (Juridique, Santé, E-commerce, Médias, Restauration, Finance, etc.), les plateformes (Trustpilot, Les Echos, Cadremploi, Google Maps, PagesJaunes, etc.), les angles (avis, offres d'emploi, prix, tendances, leads, etc.). Si des secteurs ont été générés récemment, privilégie d'AUTRES secteurs.
2. Chaque idée = "Scraping [PLATEFORME] : [angle spécifique]" — plateforme CONCRÈTE
3. Pense à des plateformes NICHE pas seulement mainstream (Médiapart, PagesJaunes, La Fourchette, Gens de Confiance, etc.)
4. Évite absolument les titres de la liste existante

Réponds UNIQUEMENT par un JSON valide :
{
  "ideas": [
    { "title": "Scraping X : ...", "platform": "X", "sector": "Secteur", "angle": "résumé angle en 5 mots", "whyOriginal": "pourquoi cette idée est originale" },
    ...
  ]
}
15 idées exactement.`

  const content = await callOpenAI(
    [
      { role: 'system', content: 'Tu es un expert en scraping et SEO. Tu réponds UNIQUEMENT en JSON valide, sans texte autour.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.85, max_tokens: 2500 },
  )

  const cleanContent = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  try {
    const parsed = JSON.parse(cleanContent)
    return Array.isArray(parsed.ideas) ? parsed.ideas : []
  } catch (e) {
    console.error('[agentExploreIdeas] Parse error:', e.message)
    return []
  }
}

// AGENT 2 - CRITIC : Évalue, ranke, suggère des améliorations
async function agentCriticReview(ideas, summary) {
  const titlesSample = (summary.titlesToAvoid || []).slice(0, 300).join('\n')
  const prompt = `Tu es un CRITIQUE SEO exigeant. Tu reçois 15 idées de cas d'usage et tu dois les évaluer.

IDÉES REÇUES (index = position dans la liste, 0-based) :
${JSON.stringify(ideas.map((i, idx) => ({ index: idx, title: i.title, sector: i.sector, whyOriginal: i.whyOriginal })), null, 2)}

TITRES EXISTANTS (échantillon - éviter les doublons) :
${titlesSample.slice(0, 6000)}

Pour chaque idée, évalue :
1. originalité (1-10) : vraiment nouveau ou variante d'existant ?
2. potentielSEO (1-10) : volume recherche estimé, mots-clés recherchés
3. intentionCommerciale (1-10) : 10 = prospect prêt à payer (scraping leads, avis pour décision, données pour business), 1 = simple curiosité
4. lethality (1-10) : "léthal" = le prospect se dit "c'est exactement mon problème" — douleur concrète, gain mesurable, urgence business
5. risqueDoublon (1-10) : 10 = doublon évident, 1 = totalement unique

Priorise les idées avec intentionCommerciale ET lethality élevés (prospect qualifié qui convertira). Retourne les 6-8 MEILLEURES idées.

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
  const selected = (parsed.selected || []).slice(0, 8)
  return selected
    .filter((s) => typeof s.index === 'number' && ideas[s.index])
    .map((s) => ({
      ...ideas[s.index],
      ...s,
      title: s.title || ideas[s.index]?.title,
    }))
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
  }))

  const prompt = `Tu es un RÉDACTEUR expert B2B. Tu développes des cas d'usage SCRAPING qui doivent être ULTRA LÉTHAUX : le prospect se dit "c'est exactement mon problème" et veut en savoir plus.

IDÉES À DÉVELOPPER (sélectionnées pour intention commerciale + potentiel conversion) :
${JSON.stringify(ideasForBuilder, null, 2)}

Titres existants à ne pas dupliquer :
${titlesListText.slice(0, 6000)}

CHECKLIST OBLIGATOIRE pour chaque cas :
1. painPoint : douleur concrète, chiffrée ("X heures perdues", "Z avis non exploités")
2. useCase : ROI/gain de temps dans les 50 premiers mots
3. dataExample : lignes réalistes qui font fantasmer le prospect
4. Titre : "Scraping [Plateforme] : [angle précis]" — plateforme concrète

FORMAT - JSON strict :
{
  "cases": [
    {
      "slug": "slug-url",
      "sector": "Secteur",
      "title": "Scraping [Platform] : [angle]",
      "description": "2-3 phrases avec pain point en tête",
      "useCase": "150-250 mots. ROI dans les 50 premiers mots.",
      "painPoint": "Phrase percutante (chiffrée si possible)",
      "personalized": {
        "whyUseCase": { "problemsSolved": "...", "concreteExamples": "...", "businessImpact": "..." },
        "benefits": { "intro": "..." },
        "dataExample": { "columns": ["C1","C2"], "sampleRows": [["v1","v2"],["v1","v2"]], "hasContactData": false }
      },
      "dataExtracted": ["Type 1", "Type 2"],
      "benefits": ["Bénéfice 1", "Bénéfice 2"],
      "examples": ["Plateforme principale"],
      "keywords": ["mot1", "mot2"],
      "attractivenessScore": 7,
      "attractivenessReason": "..."
    }
  ]
}

Développe exactement ${ideasForBuilder.length} cas, en français, B2B orienté conversion.`

  const content = await callOpenAI(
    [
      { role: 'system', content: "Tu rédiges des cas d'usage scraping en français. JSON valide uniquement, pas de ```." },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.6, max_tokens: 5500 },
  )

  const cleanContent = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  try {
    const parsed = JSON.parse(cleanContent)
    return Array.isArray(parsed.cases) ? parsed.cases : []
  } catch (e) {
    throw new Error(`Agent Builder parse error: ${e.message}`)
  }
}

// Appel OpenAI pour générer N nouveaux cas d'usage via le flux multi-agents
async function generateNewCaseStudies(existingCaseStudies, count) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquant')
  }

  const summary = buildKnowledgeSummary(existingCaseStudies)
  const titlesSet = new Set(
    existingCaseStudies
      .filter((cs) => cs.title)
      .map((cs) => cs.title.toLowerCase().trim()),
  )

  // Agent 1 : Explorer - 15 idées variées
  console.log('[generate-new-case-studies] Agent 1 (Explorer) : génération de 15 idées...')
  let ideas = []
  try {
    ideas = await agentExploreIdeas(summary)
    console.log(`[generate-new-case-studies] Agent 1 : ${ideas.length} idées générées`)
  } catch (e) {
    console.error('[generate-new-case-studies] Agent 1 erreur:', e.message)
    throw e
  }

  if (ideas.length < 3) {
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

  // Agent 3 : Builder - développe les cas complets
  const toBuild = Math.min(count + 2, selectedIdeas.length)
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

  return { generatedRaw: cases, existingTitlesSet: titlesSet }
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
    createdAt,
    generated,
    attractivenessScore,
    attractivenessReason,
    personalized: personalized || undefined,
  }
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

    // 2) Demander à l'IA de proposer de nouveaux cas d'usage qui complètent la base
    const { generatedRaw } = await generateNewCaseStudies(existingCaseStudies, maxPerRun)

    const generated = []
    for (const raw of generatedRaw) {
      try {
        const titleNorm = (raw.title || '').toLowerCase().trim()
        if (!titleNorm) continue

        // 1) Filtre exact : titre déjà existant
        if (existingTitles.has(titleNorm)) {
          console.log(`[generate-new-case-studies] Ignoré (titre exact): ${raw.title}`)
          continue
        }

        // 2) Rejet des cas génériques (sans plateforme concrète)
        const genericCheck = isGenericCaseStudy(raw)
        if (genericCheck.generic) {
          console.log(
            `[generate-new-case-studies] Ignoré (trop générique): ${raw.title} - ${genericCheck.reason}`,
          )
          continue
        }

        const normalized = normalizeGeneratedCaseStudy(raw, existingSlugs)

        // 3) Filtre sémantique : script trouve les candidats, IA tranche en zone incertaine
        const { reject, reason } = await shouldRejectCase(normalized, existingCaseStudies)
        if (reject) {
          console.log(`[generate-new-case-studies] Ignoré: ${raw.title} - ${reason}`)
          continue
        }

        existingCaseStudies.push(normalized)
        existingSlugs.add(normalized.slug)
        existingTitles.add(titleNorm)
        generated.push(normalized)
      } catch (error) {
        console.error('[generate-new-case-studies] Erreur de normalisation:', error.message)
      }
    }

    if (generated.length === 0) {
      // Cas normal : l'IA a proposé des doublons/similaires, tous filtrés par les garde-fous
      return res.status(200).json({
        ok: true,
        added: 0,
        total: existingCaseStudies.length,
        generated: [],
        message:
          'Aucun nouveau cas suffisamment original cette fois (doublons ou similaires détectés). Réessayer lors de la prochaine exécution.',
      })
    }

    // 3) Mettre à jour le blob
    blobData.caseStudies = existingCaseStudies
    blobData.count = existingCaseStudies.length
    blobData.lastUpdated = new Date().toISOString()

    await put(
      BLOB_FILENAME,
      JSON.stringify(blobData, null, 2),
      { access: 'public', allowOverwrite: true },
    )

    console.log(
      `[generate-new-case-studies] ${generated.length} nouveaux cas d'usage ajoutés. Total: ${existingCaseStudies.length}`,
    )

    // Notification Telegram (optionnelle)
    try {
      await sendTelegramNotification(generated)
    } catch (e) {
      console.warn(
        '[generate-new-case-studies] Erreur lors de la notification Telegram:',
        e.message,
      )
    }

    return res.status(200).json({
      ok: true,
      added: generated.length,
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

