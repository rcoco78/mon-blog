/**
 * Lance la sync Apify Actors → Notion (même logique que le cron)
 *
 * Usage: node scripts/run-apify-actors-videos-sync.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

async function main() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID) {
    console.error('❌ NOTION_TOKEN et NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID requis dans .env.local')
    process.exit(1)
  }

  const { getApifyActors } = require('../lib/apify-actors-api')
  const { syncActorToNotion } = require('../lib/apify-actors-notion-sync')

  const username = process.env.APIFY_PROFILE_USERNAME || 'corent1robert'
  console.log('🔄 Récupération des actors Apify...')

  const actors = await getApifyActors(username)
  console.log(`📋 ${actors.length} actors récupérés\n`)

  let created = 0
  let updated = 0

  for (const actor of actors) {
    try {
      const result = await syncActorToNotion(actor)
      if (result?.ok) {
        if (result.created) created++
        else updated++
        console.log(`  ✓ ${result.created ? 'Créé' : 'Mis à jour'} | ${actor.slug}`)
      }
    } catch (e) {
      console.warn(`  ✗ ${actor.slug}:`, e.message)
    }
  }

  console.log(`\n✅ Terminé: ${actors.length} actors, ${created} créés, ${updated} mis à jour`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
