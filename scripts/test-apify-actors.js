/**
 * Test : log les bases de données configurées et les indicateurs Apify
 *
 * Usage: node scripts/test-apify-actors.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

async function main() {
  console.log('\n=== CONFIG NOTION ===\n')
  const dbVideos = process.env.NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID
  console.log('NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID:', dbVideos || '(non configuré)')
  console.log('NOTION_TOKEN:', process.env.NOTION_TOKEN ? '✓' : '✗')

  console.log('\n=== DONNÉES APIFY (3 premiers actors) ===\n')
  const { getApifyActors } = require('../lib/apify-actors-api')
  const { getLastSnapshot } = require('../lib/apify-actors-stats-history')

  const username = process.env.APIFY_PROFILE_USERNAME || 'corent1robert'
  const actors = await getApifyActors(username)
  const lastSnap = await getLastSnapshot()

  console.log('Actors récupérés:', actors.length)
  console.log('Snapshot veille:', lastSnap ? lastSnap.date : 'aucun')
  console.log('')

  const sample = actors.slice(0, 3)
  sample.forEach((a, i) => {
    const prevUsers = lastSnap?.actors?.[a.slug]
    const delta = prevUsers != null ? a.stats.totalUsers - prevUsers : null
    console.log(`--- Actor ${i + 1}: ${a.title} ---`)
    console.log('  Slug:', a.slug)
    console.log('  Utilisateurs:', a.stats.totalUsers, delta != null ? `(Δ ${delta >= 0 ? '+' : ''}${delta})` : '')
    console.log('  Runs:', a.stats.totalRuns)
    console.log('  Taux réussite %:', a.stats.successRate)
    console.log('  Utilisateurs 30j:', a.stats.totalUsers30Days)
    console.log('  Notice:', a.notice)
    console.log('  Prix:', a.pricing?.model, a.pricing?.priceUsd != null ? `$${a.pricing.priceUsd}` : '')
    console.log('')
  })

  console.log('=== INDICATEURS SYNC NOTION (tous) ===\n')
  const allProps = [
    'Nom', 'Slug', 'Description', 'Statut vidéo', 'Vidéo YouTube',
    'Utilisateurs', 'Variation', 'Date', 'Runs', 'Taux réussite %', 'Utilisateurs 30j',
    'Bookmarks', 'Avis', 'Note /5', 'Runs 30j', 'Échecs 30j',
    'Dernier run', 'Catégorie', 'Score priorité', 'Notice',
    'Modèle tarifaire', 'Prix $', 'Essai min',
  ]
  console.log('Propriétés utilisées:', allProps.join(', '))
  console.log('\n✅ Test terminé\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
