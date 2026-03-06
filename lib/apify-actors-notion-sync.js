/**
 * Sync actors Apify → base Notion dédiée (vidéos YouTube à faire par cas d'usage)
 * Même logique que marketplace-notion-sync : une ligne par actor = une vidéo YouTube à produire
 */

const NOTION_APIFY_ACTORS_DB_ID =
  process.env.NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID || process.env.NOTION_APIFY_ACTORS_DATABASE_ID

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
 * Crée ou met à jour une ligne Notion pour un actor Apify
 * @param {Object} actor - { slug, title, description, url }
 * @param {Object} [options] - { videoUrl, variation } variation = delta users vs veille
 * @returns {Promise<{ ok: boolean, created?: boolean }|null>}
 */
async function syncActorToNotion(actor, options = {}) {
  if (typeof window !== 'undefined') return null
  const notion = getClient()
  if (!notion || !NOTION_APIFY_ACTORS_DB_ID) return null

  const slug = (actor.slug || `${actor.username}/${actor.name}` || '').trim()
  if (!slug) return null

  const props = {
    Nom: { title: [{ text: { content: actor.title || actor.name || slug } }] },
    Slug: { url: actor.url || `https://apify.com/${slug}` },
    Description: actor.description
      ? { rich_text: [{ text: { content: (actor.description || '').slice(0, 2000) } }] }
      : undefined,
  }
  // Tous les indicateurs (sync complet)
  if (actor.stats?.totalUsers !== undefined) props['Utilisateurs'] = { number: actor.stats.totalUsers }
  if (options.variation !== undefined) props['Variation'] = { number: options.variation }
  if (actor.stats) {
    if (actor.stats.totalRuns !== undefined) props['Runs'] = { number: actor.stats.totalRuns }
    if (actor.stats.successRate !== undefined) props['Taux réussite %'] = { number: actor.stats.successRate }
    if (actor.stats.totalUsers30Days !== undefined)
      props['Utilisateurs 30j'] = { number: actor.stats.totalUsers30Days }
    if (actor.stats.bookmarkCount !== undefined) props['Bookmarks'] = { number: actor.stats.bookmarkCount }
    if (actor.stats.reviewCount !== undefined) props['Avis'] = { number: actor.stats.reviewCount }
    if (actor.stats.reviewRating !== undefined) props['Note /5'] = { number: actor.stats.reviewRating }
    if (actor.stats.runs30d?.total !== undefined) props['Runs 30j'] = { number: actor.stats.runs30d.total }
    if (actor.stats.runs30d?.failed !== undefined) props['Échecs 30j'] = { number: actor.stats.runs30d.failed }
  }
  if (actor.stats?.lastRunAt) {
    props['Dernier run'] = { date: { start: actor.stats.lastRunAt.slice(0, 10) } }
  }
  if (actor.categories?.length > 0) {
    props['Catégorie'] = { select: { name: actor.categories[0] } }
  }
  if (actor.scorePriorite !== undefined) props['Score priorité'] = { number: actor.scorePriorite }
  if (actor.notice) props['Notice'] = { select: { name: actor.notice } }
  if (actor.pricing) {
    if (actor.pricing.model) props['Modèle tarifaire'] = { select: { name: actor.pricing.model } }
    if (actor.pricing.priceUsd != null) {
      props['Prix $'] = { number: actor.pricing.priceUsd }
    } else if (actor.pricing.model === 'FREE') {
      props['Prix $'] = { number: 0 }
    }
    if (actor.pricing.trialMinutes != null && actor.pricing.trialMinutes > 0) {
      props['Essai min'] = { number: actor.pricing.trialMinutes }
    }
  }
  // Date = dernier sync (aujourd'hui)
  props['Date'] = { date: { start: new Date().toISOString().slice(0, 10) } }
  // Nettoyer les props undefined
  Object.keys(props).forEach((k) => props[k] === undefined && delete props[k])

  const hasVideo = options.videoUrl && options.videoUrl.trim()

  if (hasVideo) {
    props['Vidéo YouTube'] = { url: options.videoUrl.trim() }
    props['Statut vidéo'] = { select: { name: 'Publiée' } }
  } else {
    props['Statut vidéo'] = { select: { name: 'À faire' } }
  }

  const slugPart = slug.includes('/') ? slug.split('/').pop() : slug
  try {
    const { results } = await notion.databases.query({
      database_id: NOTION_APIFY_ACTORS_DB_ID,
      filter: { property: 'Slug', url: { contains: slugPart } },
      page_size: 1,
    })

    if (results.length > 0) {
      await notion.pages.update({
        page_id: results[0].id,
        properties: props,
      })
      return { ok: true, created: false }
    }

    await notion.pages.create({
      parent: { database_id: NOTION_APIFY_ACTORS_DB_ID },
      properties: props,
    })
    return { ok: true, created: true }
  } catch (err) {
    if (err.code === 'object_not_found' || err.status === 404) {
      console.warn('[apify-actors-notion-sync] Base Notion introuvable ou propriétés différentes:', err.message)
    } else {
      console.warn('[apify-actors-notion-sync] Erreur:', err.message)
    }
    return null
  }
}

/**
 * Met à jour la propriété Vidéo YouTube et Statut vidéo → Publiée
 * @param {string} slug - Slug de l'actor (username/name)
 * @param {string} videoUrl - URL YouTube
 * @returns {Promise<boolean>}
 */
async function updateNotionVideoUrl(slug, videoUrl) {
  if (typeof window !== 'undefined') return false
  const notion = getClient()
  if (!notion || !NOTION_APIFY_ACTORS_DB_ID || !slug || !videoUrl) return false

  const slugPart = slug.includes('/') ? slug.split('/').pop() : slug
  try {
    const { results } = await notion.databases.query({
      database_id: NOTION_APIFY_ACTORS_DB_ID,
      filter: { property: 'Slug', url: { contains: slugPart } },
      page_size: 1,
    })

    if (results.length === 0) return false

    await notion.pages.update({
      page_id: results[0].id,
      properties: {
        'Vidéo YouTube': { url: videoUrl },
        'Statut vidéo': { select: { name: 'Publiée' } },
      },
    })
    return true
  } catch (err) {
    console.warn('[apify-actors-notion-sync] updateNotionVideoUrl:', err.message)
    return false
  }
}

/**
 * Met à jour Utilisateurs + Variation sur une ligne existante
 * @param {string} slug - Slug de l'actor
 * @param {Object} stats - { users, variation }
 */
async function updateActorStats(slug, stats) {
  if (typeof window !== 'undefined') return false
  const notion = getClient()
  if (!notion || !NOTION_APIFY_ACTORS_DB_ID || !stats) return false
  const slugPart = slug.includes('/') ? slug.split('/').pop() : slug
  try {
    const { results } = await notion.databases.query({
      database_id: NOTION_APIFY_ACTORS_DB_ID,
      filter: { property: 'Slug', url: { contains: slugPart } },
      page_size: 1,
    })
    if (results.length === 0) return false
    const updateProps = {
      Date: { date: { start: new Date().toISOString().slice(0, 10) } },
    }
    if (stats.users !== undefined) updateProps['Utilisateurs'] = { number: stats.users }
    if (stats.variation !== undefined) updateProps['Variation'] = { number: stats.variation }
    await notion.pages.update({ page_id: results[0].id, properties: updateProps })
    return true
  } catch (err) {
    console.warn('[apify-actors-notion-sync] updateActorStats:', err.message)
    return false
  }
}

module.exports = { syncActorToNotion, updateNotionVideoUrl, updateActorStats }
