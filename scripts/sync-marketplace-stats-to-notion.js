/**
 * Sync bases marketplace vers Notion avec métriques de priorisation
 * (impressions Search Console, clics, vues internes)
 *
 * Usage:
 *   node scripts/sync-marketplace-stats-to-notion.js
 *   node scripts/sync-marketplace-stats-to-notion.js --dry-run
 *
 * Prérequis : NOTION_TOKEN, GOOGLE_SERVICE_ACCOUNT_KEY ou service-account-key.json
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const DELAY_MS = 150

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')

  if (!process.env.NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN requis. Configurez .env.local')
    process.exit(1)
  }

  const { getAllDatabases } = await import('../lib/marketplace-databases.js')
  const { getSearchConsoleDataForMarketplace } = await import('../lib/search-console.js')
  const { getMarketplaceViewsBySlug, getMarketplaceSalesBySlug, computePriorityScore } = await import('../lib/marketplace-stats.js')
  const { getMarketplaceVideoMapping } = await import('../lib/marketplace-videos.js')
  const notionSync = await import('../lib/marketplace-notion-sync.js')
  const syncDatabaseToNotion = notionSync.default?.syncDatabaseToNotion || notionSync.syncDatabaseToNotion

  console.log('🔄 Chargement des données...')
  let databases = []
  let scData = {}
  let viewsBySlug = {}
  let salesBySlug = {}
  let videoMapping = {}
  try {
    ;[databases, scData, viewsBySlug, salesBySlug, videoMapping] = await Promise.all([
      getAllDatabases(),
      getSearchConsoleDataForMarketplace({ days: 365 }).catch(() => ({})),
      getMarketplaceViewsBySlug().catch(() => ({})),
      getMarketplaceSalesBySlug().catch(() => ({})),
      getMarketplaceVideoMapping().catch(() => ({})),
    ])
  } catch (e) {
    console.error('❌ Erreur chargement:', e.message)
    process.exit(1)
  }

  if (databases.length === 0) {
    console.log('ℹ️  Aucune base à synchroniser.')
    process.exit(0)
  }

  const scCount = Object.keys(scData).length
  const viewsCount = Object.keys(viewsBySlug).length
  const salesCount = Object.keys(salesBySlug).length
  console.log(`📋 ${databases.length} base(s), ${scCount} SC, ${viewsCount} vues, ${salesCount} avec ventes`)
  console.log(`   Sync vers Notion (avec Impressions, Clics, Vues)${isDryRun ? ' (dry-run)' : ''}...`)

  let created = 0
  let updated = 0
  let errors = 0

  for (let i = 0; i < databases.length; i++) {
    const db = databases[i]
    const slug = (db.slug || '').trim()
    if (!slug) {
      console.warn(`  ⏭️  Skip (pas de slug): ${db.name}`)
      continue
    }

    if (isDryRun) {
      const sc = scData[slug]
      const views = viewsBySlug[slug] || 0
      const ventes = salesBySlug[slug] || 0
      console.log(`  [dry-run] ${slug} | imp: ${sc?.impressions ?? 0} | clics: ${sc?.clicks ?? 0} | pos: ${sc?.position ?? '-'} | vues: ${views} | ventes: ${ventes}`)
      continue
    }

    try {
      const sc = scData[slug]
      const impressions = sc?.impressions ?? 0
      const clicks = sc?.clicks ?? 0
      const position = sc?.position
      const views = viewsBySlug[slug] || 0
      const ventes = salesBySlug[slug] || 0
      const videoUrl = videoMapping[slug] || null
      const scorePriorite = computePriorityScore(impressions, clicks, views, !!videoUrl, ventes, position)

      const options = { impressions, clicks, views, ventes, scorePriorite }
      if (position != null && position > 0) options.position = position
      if (videoUrl) options.videoUrl = videoUrl

      const result = await syncDatabaseToNotion(db, options)
      if (result) {
        if (result.created) created++
        else updated++
        console.log(`  ✓ ${slug} (${result.created ? 'créé' : 'mis à jour'}) score:${options.scorePriorite} imp:${options.impressions} clics:${options.clicks} vues:${options.views} ventes:${options.ventes}`)
      }
      await sleep(DELAY_MS)
    } catch (e) {
      errors++
      console.warn(`  ✗ ${slug}: ${e.message}`)
    }
  }

  console.log(`\n✅ Terminé : ${created} créé(s), ${updated} mis à jour, ${errors} erreur(s)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
