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

  return buildStructuredData(queryRows, pageRows, excludeQueries)
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
    minImpressions = 30,
    maxCtrPercent = 2.5,
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

function getEmptyData() {
  return {
    queriesToTarget: [],
    queriesWeRankFor: [],
    performingSectors: [],
    topQueriesByImpressions: [],
    topPagesByClicks: [],
    hasData: false,
  }
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
 */
function buildStructuredData(queryRows, pageRows, excludeQueries = []) {
  if (!queryRows.length && !pageRows.length) {
    return getEmptyData()
  }

  // Requêtes : opportunités (position 8-60, impressions >= 2) vs déjà couvertes (position < 12)
  // Critères élargis pour avoir un pool durable (sinon on épuise en quelques jours)
  const queriesToTarget = []
  const queriesWeRankFor = []
  const topQueriesByImpressions = []

  // Score d'opportunité : impressions × potentiel de gain (1/position) × bonus clics
  // → Traite en priorité : gros volume + quasi page 1 + preuve d'intention (clics)
  function opportunityScore(imp, pos, clicks) {
    const positionFactor = 1 / Math.max(pos, 1) // pos 10 = 0.1, pos 20 = 0.05
    const clickBonus = 1 + Math.min(clicks * 0.5, 5) // jusqu'à +5 si beaucoup de clics
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
    if (pos >= 8 && pos <= 60 && imp >= 2 && !excludeQueries.includes(q)) {
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
    queriesToTarget: queriesToTarget.slice(0, 150), // Pool plus large pour ne pas s'épuiser
    queriesWeRankFor: queriesWeRankFor.slice(0, 400),
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
