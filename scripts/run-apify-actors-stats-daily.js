/**
 * Lance le cron stats daily (même logique que le cron)
 *
 * Usage: node scripts/run-apify-actors-stats-daily.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

async function main() {
  const { getApifyActors } = require('../lib/apify-actors-api')
  const { getLastSnapshot, saveSnapshot } = require('../lib/apify-actors-stats-history')
  const { updateActorStats } = require('../lib/apify-actors-notion-sync')

  const username = process.env.APIFY_PROFILE_USERNAME || 'corent1robert'
  const today = new Date().toISOString().slice(0, 10)

  console.log('🔄 Récupération des actors Apify...')
  const actors = await getApifyActors(username)
  const lastSnap = await getLastSnapshot()

  const currentMap = Object.fromEntries(actors.map((a) => [a.slug, a.stats.totalUsers]))
  const prevMap = lastSnap?.actors || {}

  const rows = actors.map((a) => {
    const users = a.stats.totalUsers
    const prevUsers = prevMap[a.slug]
    const delta = prevUsers != null ? users - prevUsers : 0
    return { slug: a.slug, title: a.title, url: a.url, users, delta }
  })

  await saveSnapshot(today, currentMap)
  console.log('✓ Snapshot sauvegardé')

  const mainDbId =
    process.env.NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID || process.env.NOTION_APIFY_ACTORS_DATABASE_ID
  if (mainDbId) {
    let ok = 0
    for (const row of rows) {
      const updated = await updateActorStats(row.slug, { users: row.users, variation: row.delta })
      if (updated) ok++
      await new Promise((r) => setTimeout(r, 120))
    }
    console.log('✓ Notion:', ok, '/', rows.length, 'lignes mises à jour')
  } else {
    console.log('ℹ NOTION_APIFY_ACTORS_VIDEOS_DATABASE_ID non configuré')
  }

  const progression = rows.filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3)
  const stagnation = rows.filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3)

  console.log('\n📊 Top 3 progression:')
  progression.forEach((r, i) => console.log(`  ${i + 1}. ${r.title} +${r.delta} (${r.users} total)`))
  console.log('\n📉 Top 3 en baisse:')
  stagnation.forEach((r, i) => console.log(`  ${i + 1}. ${r.title} ${r.delta} (${r.users} total)`))

  console.log('\n✅ Terminé')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
