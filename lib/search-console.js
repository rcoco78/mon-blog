/**
 * Module Search Console — récupération des données SEO pour alimenter la génération de cas d'usage
 *
 * Utilisé par le cron generate-new-case-studies pour :
 * - Cibler des requêtes réelles (opportunités)
 * - Éviter la cannibalisation (requêtes déjà couvertes)
 * - Prioriser les secteurs qui performent
 *
 * Variables d'environnement (optionnel) :
 * - GOOGLE_SERVICE_ACCOUNT_KEY : JSON stringifié du service account (Vercel)
 * - Sinon : service-account-key.json à la racine (local)
 */

import { google } from 'googleapis'
import fs from 'fs/promises'
import path from 'path'

const SITE_URL = 'sc-domain:corentinrobert.fr'

async function getAuth() {
  let serviceAccount = null

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    } catch {
      return null
    }
  } else {
    const keyPath = path.join(process.cwd(), 'service-account-key.json')
    try {
      await fs.access(keyPath)
      serviceAccount = JSON.parse(await fs.readFile(keyPath, 'utf8'))
    } catch {
      return null
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  return auth.getClient()
}

/**
 * Requête Search Analytics avec fallback gracieux
 */
async function querySearchAnalytics(client, requestBody, dimensions = []) {
  try {
    const { data } = await client.searchanalytics.query({
      requestBody: { ...requestBody, dimensions: dimensions.length ? dimensions : undefined },
      siteUrl: SITE_URL,
    })
    return data?.rows || []
  } catch (err) {
    console.warn('[search-console] Erreur query:', err.message)
    return []
  }
}

/**
 * Récupère les données Search Console utiles pour la génération de cas d'usage
 *
 * @param {Object} options
 * @param {number} options.days - Nombre de jours (défaut: 90, soit 3 mois)
 * @param {number} options.queriesLimit - Nombre de requêtes à récupérer (défaut: 500)
 * @param {number} options.pagesLimit - Nombre de pages (défaut: 200)
 * @param {string[]} options.excludeQueries - Requêtes déjà traitées récemment (à exclure pour éviter répétition)
 * @returns {Promise<Object>} Données structurées pour Explorer + Critic
 */
export async function getSearchConsoleData(options = {}) {
  const { days = 90, queriesLimit = 500, pagesLimit = 200, excludeQueries = [] } = options

  const auth = await getAuth()
  if (!auth) {
    console.warn('[search-console] Pas de credentials — données Search Console ignorées')
    return getEmptyData()
  }

  const client = google.searchconsole({ version: 'v1', auth })

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startStr = startDate.toISOString().slice(0, 10)
  const endStr = endDate.toISOString().slice(0, 10)

  const baseBody = { startDate: startStr, endDate: endStr }

  // 1) Requêtes — toutes (pour opportunités + cannibalisation)
  const queryRows = await querySearchAnalytics(client, {
    ...baseBody,
    rowLimit: queriesLimit,
  }, ['query'])

  // 2) Pages par clics (pour secteurs performants)
  const pageRows = await querySearchAnalytics(client, {
    ...baseBody,
    rowLimit: pagesLimit,
  }, ['page'])

  // 3) Page + query : savoir quelle URL porte chaque requête (blog vs cas-usage)
  const pageQueryRows = await querySearchAnalytics(client, {
    ...baseBody,
    rowLimit: Math.min(5000, queriesLimit * 4),
  }, ['page', 'query'])

  return buildStructuredData(queryRows, pageRows, excludeQueries, pageQueryRows)
}

/**
 * Récupère les pages pour analyse CTR (impressions élevées, CTR faible)
 * @param {Object} options
 * @param {number} options.days
 * @param {number} options.rowLimit
 * @param {number} options.minImpressions
 * @param {number} options.maxCtrPercent
 * @returns {Promise<Array<{path, impressions, clicks, ctr, position}>>}
 */
export async function getSearchConsolePagesForCTR(options = {}) {
  const {
    days = 90,
    rowLimit = 500,
    minImpressions = 10,
    maxCtrPercent = 5.0,
  } = options

  const auth = await getAuth()
  if (!auth) return []

  const client = google.searchconsole({ version: 'v1', auth })
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const rows = await querySearchAnalytics(client, {
    startDate: startStr,
    endDate: endStr,
    rowLimit,
  }, ['page'])

  return rows
    .map((row) => {
      const url = row.keys?.[0] || ''
      const path = url.replace(/^https?:\/\/[^/]+/, '') || '/'
      return {
        path: path || '/',
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: (row.ctr || 0) * 100,
        position: row.position || 0,
      }
    })
    .filter((r) => r.path && r.impressions >= minImpressions && r.ctr < maxCtrPercent)
    .sort((a, b) => b.impressions - a.impressions)
}

/**
 * Récupère les données Search Console pour les pages marketplace uniquement
 * Utilisé pour prioriser les vidéos (impressions + clics organiques par base)
 *
 * @param {Object} options
 * @param {number} options.days - Nombre de jours (défaut: 365, max dispo Search Console ~16 mois)
 * @param {number} options.rowLimit - Nombre de pages à récupérer (défaut: 1000)
 * @returns {Promise<Record<string, { impressions: number, clicks: number, position: number }>>}
 */
export async function getSearchConsoleDataForMarketplace(options = {}) {
  const { days = 365, rowLimit = 5000 } = options

  const auth = await getAuth()
  if (!auth) return {}

  const client = google.searchconsole({ version: 'v1', auth })
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const rows = await querySearchAnalytics(client, {
    startDate: startStr,
    endDate: endStr,
    rowLimit,
  }, ['page'])

  const result = {}
  for (const row of rows) {
    const url = row.keys?.[0] || ''
    const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || ''
    if (!path.includes('/marketplace/')) continue

    const parts = path.split('/').filter(Boolean)
    if (parts.length < 3) continue
    const slug = parts[parts.length - 1]
    if (!slug) continue

    const impressions = row.impressions || 0
    const clicks = row.clicks || 0
    const position = row.position ?? 0

    if (result[slug]) {
      result[slug].impressions += impressions
      result[slug].clicks += clicks
      result[slug].positionSum += position * impressions
    } else {
      result[slug] = { impressions, clicks, positionSum: position * impressions }
    }
  }

  // Convertir positionSum en position moyenne pondérée
  for (const slug of Object.keys(result)) {
    const r = result[slug]
    r.position = r.impressions > 0 ? Math.round((r.positionSum / r.impressions) * 10) / 10 : 0
    delete r.positionSum
  }

  return result
}

/**
 * Retourne les top requêtes SC pour une liste de pages — un seul appel API batch.
 * Indispensable pour que GPT sache sur quoi la page ranke réellement.
 *
 * @param {string[]} paths - ex. ['/cas-usage/e-commerce/scraping-vinted', ...]
 * @param {{ days?: number }} options
 * @returns {Promise<Record<string, Array<{query, impressions, clicks, ctr, position}>>>}
 */
export async function getTopQueriesForPages(paths, options = {}) {
  const { days = 90 } = options
  if (!paths || paths.length === 0) return {}

  const auth = await getAuth()
  if (!auth) return {}

  const client = google.searchconsole({ version: 'v1', auth })
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  // Un seul call avec dimensions page+query, rowLimit généreux
  const rows = await querySearchAnalytics(client, {
    startDate: startStr,
    endDate: endStr,
    rowLimit: 5000,
  }, ['page', 'query'])

  // Regrouper par path
  const BASE = 'https://www.corentinrobert.fr'
  const pathSet = new Set(paths)
  const result = {}

  for (const row of rows) {
    const url = row.keys?.[0] || ''
    const query = row.keys?.[1] || ''
    const path = url.replace(/^https?:\/\/[^/]+/, '') || '/'
    if (!pathSet.has(path)) continue

    if (!result[path]) result[path] = []
    result[path].push({
      query,
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      ctr: (row.ctr || 0) * 100,
      position: row.position || 0,
    })
  }

  // Trier chaque page par impressions desc, garder top 8
  for (const path of Object.keys(result)) {
    result[path] = result[path]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 8)
  }

  return result
}

function getEmptyData() {
  return {
    queriesToTarget: [],
    queriesWeRankFor: [],
    blogOwnedQueries: [],
    performingSectors: [],
    topQueriesByImpressions: [],
    topPagesByClicks: [],
    hasData: false,
  }
}

/** Requêtes déjà portées par le blog (ne pas créer de cas d'usage dessus) */
function buildBlogOwnedQueries(pageQueryRows = []) {
  const blogBest = new Map() // query -> { path, position, impressions }

  for (const row of pageQueryRows) {
    const pageUrl = row.keys?.[0] || ''
    const query = (row.keys?.[1] || '').toLowerCase().trim()
    if (!query) continue
    const path = pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'
    if (!path.includes('/blog/')) continue

    const position = row.position || 99
    const impressions = row.impressions || 0
    // Blog déjà visible (top 20) → le blog « possède » la requête
    if (position > 20 || impressions < 2) continue

    const prev = blogBest.get(query)
    if (!prev || position < prev.position) {
      blogBest.set(query, { path, position, impressions })
    }
  }

  return [...blogBest.entries()].map(([query, meta]) => ({
    query,
    path: meta.path,
    position: meta.position,
    impressions: meta.impressions,
  }))
}

function isCommercialOpportunity(query) {
  if (!query) return false
  // Intention transactionnelle / extraction de données
  if (
    /\b(scrap(e|er|ing|peur|ping)?|extraction|extraire|données|leads?|emails?|contacts?|api|prix|avis|reviews?|profils?)\b/i.test(
      query,
    )
  ) {
    return true
  }
  // Plateforme connue + terme data-adjacent implicite (ex. "linkedin emails")
  if (
    /\b(linkedin|airbnb|amazon|leboncoin|doctolib|tripadvisor|booking|indeed|glassdoor|instagram|tiktok|facebook|maps|pages jaunes)\b/i.test(
      query,
    )
  ) {
    return true
  }
  return false
}

// Requêtes bruit : ISBN, emails, caractères suspects, etc.
function isNoiseQuery(q) {
  if (!q || typeof q !== 'string') return true
  const s = q.trim()
  if (s.length < 4) return true
  // ISBN : 978-0-123-45678-9 ou similaires
  if (/^\d{3}-?\d-?\d{3}-?\d{5}-?[\dX]$/i.test(s)) return true
  if (/^\d{13}$/.test(s.replace(/-/g, ''))) return true
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return true
  if (/["']?[\w.-]+@[\w.-]+\.\w+["']?/.test(s) && s.length < 50) return true
  // Trop de chiffres ou caractères spéciaux
  const digitRatio = (s.match(/\d/g) || []).length / s.length
  if (digitRatio > 0.5) return true
  // Caractères bizarres (hors lettres, chiffres, espaces, tirets)
  if (/[^\p{L}\p{N}\s\-_']/u.test(s) && !/[a-zA-Z]{4,}/.test(s)) return true
  return false
}

/**
 * Structure les données brutes pour l'Explorer et le Critic
 * @param {string[]} excludeQueries - Requêtes à exclure (déjà traitées au run précédent)
 * @param {Array} pageQueryRows - lignes page+query pour détecter la propriété blog
 */
function buildStructuredData(queryRows, pageRows, excludeQueries = [], pageQueryRows = []) {
  if (!queryRows.length && !pageRows.length) {
    return getEmptyData()
  }

  const blogOwned = buildBlogOwnedQueries(pageQueryRows)
  const blogOwnedSet = new Set(blogOwned.map((b) => b.query.toLowerCase()))

  // Requêtes : opportunités (position 8-60, impressions >= 2) vs déjà couvertes (position < 12)
  // Critères élargis pour avoir un pool durable (sinon on épuise en quelques jours)
  const queriesToTarget = []
  const queriesWeRankFor = []
  const topQueriesByImpressions = []

  // Score d'opportunité : favorise les requêtes proches de la page 1 (pos 8-20 = easy wins)
  // Logique : mieux vaut passer de la pos 15 à 5 que de la pos 50 à 40
  function opportunityScore(imp, pos, clicks) {
    // Facteur position : bonus fort pour pos 8-20, dégressif au-delà
    let positionFactor
    if (pos <= 20) {
      positionFactor = 2.0 / Math.max(pos, 1) // pos 10 → 0.2, pos 15 → 0.13, pos 20 → 0.1
    } else if (pos <= 35) {
      positionFactor = 1.0 / Math.max(pos, 1) // pos 25 → 0.04, pos 35 → 0.029
    } else {
      positionFactor = 0.4 / Math.max(pos, 1) // pos 50 → 0.008 (fortement pénalisé)
    }
    const clickBonus = 1 + Math.min(clicks * 1.5, 8) // bonus clics plus fort (preuve d'intention)
    return imp * positionFactor * clickBonus
  }

  for (const row of queryRows) {
    const q = row.keys?.[0] || ''
    const pos = row.position || 0
    const imp = row.impressions || 0
    const clicks = row.clicks || 0

    if (!q || q.length < 3) continue
    if (isNoiseQuery(q)) continue

    topQueriesByImpressions.push({ query: q, position: pos, impressions: imp, clicks })

    // Opportunité : pos 8-60, imp >= 2 — on score pour prioriser (sauf si déjà traitée)
    // Exclure si le blog porte déjà la requête (anti-cannibalisation blog ↔ cas d'usage)
    const qLower = q.toLowerCase()
    if (
      pos >= 8 &&
      pos <= 60 &&
      imp >= 2 &&
      !excludeQueries.includes(q) &&
      !blogOwnedSet.has(qLower) &&
      isCommercialOpportunity(q)
    ) {
      queriesToTarget.push({
        query: q,
        position: pos,
        impressions: imp,
        clicks,
        score: opportunityScore(imp, pos, clicks),
      })
    }
    // Déjà couvert : position solide → éviter de cannibaliser
    if (pos < 12 && (imp >= 2 || clicks >= 1) && !isNoiseQuery(q)) {
      queriesWeRankFor.push(q)
    }
  }

  // Tri par score décroissant : les meilleures opportunités en premier
  queriesToTarget.sort((a, b) => (b.score || 0) - (a.score || 0))

  // Clustering : regrouper les variantes de la même requête en un seul cluster
  // Ex: "idealo scraper" + "idealo scraping" + "scrape idealo" → un cluster avec toutes les variantes
  // L'Explorer génère une seule page qui cible toutes les variantes → meilleure optimisation SEO
  function clusterQueries(queries) {
    const clusters = []
    const assigned = new Set()

    function normalize(q) {
      return q
        .toLowerCase()
        .replace(/\b(scraping|scraper|scrape|scrapper|scrappeur|extraction|extraire|how to|comment|api|gratuit|free|logiciel|outil|tool|web|site|fr|de|ch|en|les|des|la|le|du|et|pour|sur)\b/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    function similarity(a, b) {
      const na = normalize(a).split(' ').filter(Boolean)
      const nb = normalize(b).split(' ').filter(Boolean)
      if (na.length === 0 || nb.length === 0) return 0
      const setA = new Set(na)
      const setB = new Set(nb)
      let inter = 0
      for (const w of setA) { if (setB.has(w)) inter++ }
      const union = setA.size + setB.size - inter
      return union === 0 ? 0 : inter / union
    }

    for (let i = 0; i < queries.length; i++) {
      if (assigned.has(i)) continue
      const seed = queries[i]
      const cluster = {
        mainQuery: seed.query,
        variants: [seed.query],
        impressions: seed.impressions,
        clicks: seed.clicks,
        position: seed.position, // position de la requête principale
        score: seed.score,
      }
      assigned.add(i)

      for (let j = i + 1; j < queries.length; j++) {
        if (assigned.has(j)) continue
        if (similarity(seed.query, queries[j].query) >= 0.5) {
          cluster.variants.push(queries[j].query)
          cluster.impressions += queries[j].impressions
          cluster.clicks += queries[j].clicks
          // Garder la position la plus haute (= la plus facile à améliorer)
          if (queries[j].position < cluster.position) {
            cluster.position = queries[j].position
          }
          cluster.score += queries[j].score
          assigned.add(j)
        }
      }

      // Détecter si une variante du cluster rank déjà très bien (pos < 8)
      // → risque de cannibalisation si on crée une nouvelle page sur ce cluster
      // La variante bien rankée est dans queriesWeRankFor (pos < 12) mais ici on cherche pos < 8
      // On le marque pour que l'Explorer propose un angle COMPLÉMENTAIRE plutôt qu'une page concurrente
      cluster.hasStrongRanking = false
      cluster.strongRankingPosition = null

      clusters.push(cluster)
    }

    return clusters
  }

  // Construire un index des positions pour toutes les requêtes (y compris celles hors opportunités)
  const allQueryPositions = {}
  for (const row of queryRows) {
    const q = row.keys?.[0] || ''
    if (q) allQueryPositions[q.toLowerCase()] = row.position || 99
  }

  const clusteredOpportunities = clusterQueries(queriesToTarget)

  // Vérifier si une variante du cluster rank déjà pos < 8 (risque de cannibalisation)
  for (const cluster of clusteredOpportunities) {
    for (const variant of cluster.variants) {
      const pos = allQueryPositions[variant.toLowerCase()]
      if (pos !== undefined && pos < 8) {
        cluster.hasStrongRanking = true
        cluster.strongRankingPosition = Math.round(pos)
        break
      }
    }
    // Vérifier aussi la requête principale
    if (!cluster.hasStrongRanking) {
      const mainPos = allQueryPositions[cluster.mainQuery.toLowerCase()]
      if (mainPos !== undefined && mainPos < 8) {
        cluster.hasStrongRanking = true
        cluster.strongRankingPosition = Math.round(mainPos)
      }
    }
  }

  clusteredOpportunities.sort((a, b) => (b.score || 0) - (a.score || 0))

  // Pages performantes : extraire les secteurs des /cas-usage/
  const sectorClicks = {}
  const topPagesByClicks = []

  for (const row of pageRows) {
    const pageUrl = row.keys?.[0] || ''
    const clicks = row.clicks || 0
    const imp = row.impressions || 0

    topPagesByClicks.push({ url: pageUrl, clicks, impressions: imp })

    // Cas d'usage : /cas-usage/SECTEUR/slug (URL absolue ou chemin)
    const casMatch = pageUrl.match(/\/cas-usage\/([^/]+)(?:\/|$)/)
    if (casMatch && clicks >= 1) {
      const sectorSlug = casMatch[1]
      const sector = slugToSector(sectorSlug)
      sectorClicks[sector] = (sectorClicks[sector] || 0) + clicks
    }
  }

  const performingSectors = Object.entries(sectorClicks)
    .sort((a, b) => b[1] - a[1])
    .map(([sector]) => sector)

  return {
    queriesToTarget: queriesToTarget.slice(0, 150),
    clusteredOpportunities: clusteredOpportunities.slice(0, 80), // clusters priorisés par score
    queriesWeRankFor: queriesWeRankFor.slice(0, 400),
    blogOwnedQueries: blogOwned.slice(0, 200),
    performingSectors: performingSectors.slice(0, 20),
    topQueriesByImpressions: topQueriesByImpressions.slice(0, 100),
    topPagesByClicks: topPagesByClicks.slice(0, 50),
    hasData: true,
  }
}

// Slug secteur → label lisible (approximatif, les slugs sont déjà formatés)
function slugToSector(slug) {
  if (!slug) return 'Autres'
  const map = {
    'recrutement-rh': 'Recrutement & RH',
    'ia-machine-learning': 'IA / Machine Learning',
    'reseaux-sociaux-lead-generation': 'Réseaux sociaux & Lead gen',
    'immobilier': 'Immobilier',
    'e-commerce': 'E-commerce',
    'automatisation': 'Automatisation',
    'developpement': 'Développement',
    'sante': 'Santé',
    'finance': 'Finance',
    'marketing': 'Marketing',
    'juridique': 'Juridique',
    'tourisme': 'Tourisme',
  }
  return map[slug] || slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
