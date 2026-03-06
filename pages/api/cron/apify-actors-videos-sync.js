/**
 * Cron Apify Actors → Notion : synchronise les actors publics du profil Apify
 * vers une base Notion dédiée pour planifier les vidéos YouTube à faire.
 *
 * Même logique que tella-marketplace-videos mais pour les actors Apify :
 * - Récupère les actors via l'API Store (pas de Cheerio, API officielle)
 * - Une ligne Notion par actor = une vidéo YouTube à produire par cas d'usage
 * - Statut vidéo : À faire / Publiée
 */

import { getApifyActors } from '../../../lib/apify-actors-api'
import { syncActorToNotion } from '../../../lib/apify-actors-notion-sync'

const APIFY_USERNAME = process.env.APIFY_PROFILE_USERNAME || 'corent1robert'

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

  if (!process.env.NOTION_TOKEN || !process.env.NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID) {
    return res.status(500).json({
      error: 'NOTION_TOKEN et NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID requis',
    })
  }

  try {
    const actors = await getApifyActors(APIFY_USERNAME)
    console.log('[apify-actors-videos-sync] Actors récupérés:', actors.length)

    let created = 0
    let updated = 0
    const errors = []

    for (const actor of actors) {
      try {
        const result = await syncActorToNotion(actor)
        if (result?.ok) {
          if (result.created) created++
          else updated++
          console.log('[apify-actors-videos-sync]', result.created ? 'Créé' : 'Mis à jour', actor.slug)
        }
      } catch (e) {
        errors.push({ slug: actor.slug, message: e.message })
        console.warn('[apify-actors-videos-sync] Erreur', actor.slug, ':', e.message)
      }
    }

    console.log(
      '[apify-actors-videos-sync]',
      `Terminé: ${actors.length} actors, ${created} créés, ${updated} mis à jour`
    )

    return res.status(200).json({
      ok: true,
      total: actors.length,
      created,
      updated,
      errors: errors.slice(0, 10),
    })
  } catch (err) {
    console.error('[apify-actors-videos-sync]', err)
    return res.status(500).json({ error: err.message })
  }
}

export const config = {
  maxDuration: 60,
}
