/**
 * Sync marketplace databases → Notion (stratégie vidéo)
 * - syncDatabaseToNotion : create/update par slug (cron enrich)
 * - updateNotionVideoUrl : met à jour Vidéo Tella + Statut (cron Tella)
 */

const NOTION_VIDEO_DB_ID =
  process.env.NOTION_VIDEO_STRATEGY_DATABASE_ID || '31936de01fe5805c957ef05206b9d70e'
const SITE_URL = 'https://www.corentinrobert.fr'

// Mapping catégorie → slug URL (aligné avec marketplace-helpers)
const CATEGORY_TO_SLUG = {
  Immobilier: 'immobilier',
  Artisanat: 'artisanat',
  B2B: 'b2b',
  Finance: 'finance',
  'E-commerce': 'e-commerce',
  Retail: 'retail',
  Services: 'services',
  Santé: 'sante',
  Éducation: 'education',
  'Sport & Loisirs': 'sport-loisirs',
  'Beauté & Bien-être': 'beaute-bien-etre',
  Automobile: 'automobile',
  Hôtellerie: 'hotellerie',
  Juridique: 'juridique',
  'Transport & Logistique': 'transport-logistique',
  'Tourisme & Voyage': 'tourisme-voyage',
  Automatisation: 'automatisation',
  Autres: 'autres',
  Développement: 'developpement',
  'IA & Machine Learning': 'ia-machine-learning',
  'Médias & Actualités': 'medias-actualites',
  'Recrutement & RH': 'recrutement-rh',
  'Réseaux Sociaux & Lead Generation': 'reseaux-sociaux-lead-generation',
  'SEO & Analytics': 'seo-analytics',
  VC: 'vc',
  'Venture Capital': 'vc',
  'Capital Risque': 'vc',
}

function categoryToSlug(category) {
  if (!category) return 'autres'
  return CATEGORY_TO_SLUG[category] || 'autres'
}

function getClient() {
  const token = process.env.NOTION_TOKEN
  if (!token) return null
  try {
    const { Client } = require('@notionhq/client')
    return new Client({ auth: token })
  } catch {
    return null
  }
}

/**
 * Crée ou met à jour une ligne Notion pour une base marketplace
 * @param {Object} database - { slug, name, category, rowCount, lastEnriched }
 * @param {Object} [options] - { videoUrl, impressions, clicks, views, scorePriorite, ventes, position } métriques de priorisation
 * @returns {Promise<{ ok: boolean, created?: boolean }|null>}
 */
async function syncDatabaseToNotion(database, options = {}) {
  if (typeof window !== 'undefined') return null
  const notion = getClient()
  if (!notion) return null

  const slug = (database.slug || '').trim()
  if (!slug) return null

  const categorySlug = categoryToSlug(database.category)
  const pageUrl = `${SITE_URL}/marketplace/${categorySlug}/${slug}`

  const props = {
    Nom: { title: [{ text: { content: database.name || slug } }] },
    Slug: { url: pageUrl },
    Catégorie: { select: { name: database.category || 'Autres' } },
    Prix: { number: database.isPaid ? (database.price ?? 0) : 0 },
    Lignes: { number: database.rowCount || 0 },
    'Dernière MAJ': {
      date: { start: (database.lastEnriched || new Date().toISOString()).slice(0, 10) },
    },
  }
  if (options.impressions !== undefined) props.Impressions = { number: options.impressions }
  if (options.clicks !== undefined) props.Clics = { number: options.clicks }
  if (options.views !== undefined) props.Vues = { number: options.views }
  if (options.ventes !== undefined) props.Ventes = { number: options.ventes }
  if (options.scorePriorite !== undefined) props['Score priorité'] = { number: options.scorePriorite }
  if (options.position !== undefined && options.position > 0) props['Pos. moyenne'] = { number: options.position }
  if (options.videoUrl?.trim()) {
    props['Vidéo Tella'] = { url: options.videoUrl.trim() }
    props['Statut vidéo'] = { select: { name: 'Publiée' } }
  }

  try {
    const { results } = await notion.databases.query({
      database_id: NOTION_VIDEO_DB_ID,
      filter: { property: 'Slug', url: { contains: slug } },
      page_size: 1,
    })

    if (results.length > 0) {
      await notion.pages.update({
        page_id: results[0].id,
        properties: props,
      })
      return { ok: true, created: false }
    }

    const hasVideo = options.videoUrl && options.videoUrl.trim()
    const createProps = {
      ...props,
      'Statut vidéo': { select: { name: hasVideo ? 'Publiée' : 'À faire' } },
    }
    if (hasVideo) {
      createProps['Vidéo Tella'] = { url: options.videoUrl.trim() }
    }

    await notion.pages.create({
      parent: { database_id: NOTION_VIDEO_DB_ID },
      properties: createProps,
    })
    return { ok: true, created: true }
  } catch (err) {
    if (err.code === 'object_not_found' || err.status === 404) {
      console.warn('[marketplace-notion-sync] Base Notion introuvable ou propriétés différentes:', err.message)
    } else {
      console.warn('[marketplace-notion-sync] Erreur:', err.message)
    }
    return null
  }
}

/**
 * Met à jour la propriété Vidéo Tella et Statut vidéo → Publiée
 * @param {string} slug - Slug de la base
 * @param {string} videoUrl - URL embed ou page Tella
 * @returns {Promise<boolean>}
 */
async function updateNotionVideoUrl(slug, videoUrl) {
  if (typeof window !== 'undefined') return false
  const notion = getClient()
  if (!notion || !slug || !videoUrl) return false

  try {
    const { results } = await notion.databases.query({
      database_id: NOTION_VIDEO_DB_ID,
      filter: { property: 'Slug', url: { contains: slug } },
      page_size: 1,
    })

    if (results.length === 0) return false

    await notion.pages.update({
      page_id: results[0].id,
      properties: {
        'Vidéo Tella': { url: videoUrl },
        'Statut vidéo': { select: { name: 'Publiée' } },
      },
    })
    return true
  } catch (err) {
    console.warn('[marketplace-notion-sync] updateNotionVideoUrl:', err.message)
    return false
  }
}

/**
 * Efface la Vidéo Tella et remet le statut à "À faire"
 * @param {string} slug - Slug de la base
 * @returns {Promise<boolean>}
 */
async function clearNotionVideoUrl(slug) {
  if (typeof window !== 'undefined') return false
  const notion = getClient()
  if (!notion || !slug) return false

  try {
    const { results } = await notion.databases.query({
      database_id: NOTION_VIDEO_DB_ID,
      filter: { property: 'Slug', url: { contains: slug } },
      page_size: 1,
    })

    if (results.length === 0) return false

    await notion.pages.update({
      page_id: results[0].id,
      properties: {
        'Vidéo Tella': { url: null },
        'Statut vidéo': { select: { name: 'À faire' } },
      },
    })
    return true
  } catch (err) {
    console.warn('[marketplace-notion-sync] clearNotionVideoUrl:', err.message)
    return false
  }
}

module.exports = { syncDatabaseToNotion, updateNotionVideoUrl, clearNotionVideoUrl }
