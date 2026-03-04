/**
 * Script rétroactif : sync toutes les bases marketplace vers Notion
 * Crée une ligne Notion pour chaque base qui n'en a pas encore
 *
 * Usage:
 *   node scripts/sync-marketplace-to-notion.js
 *   node scripts/sync-marketplace-to-notion.js --dry-run
 *
 * Prérequis : NOTION_TOKEN, NOTION_VIDEO_STRATEGY_DATABASE_ID (optionnel)
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
  const { getMarketplaceVideoMapping } = await import('../lib/marketplace-videos.js')
  const { getSearchConsoleDataForMarketplace } = await import('../lib/search-console.js')
  const { getMarketplaceViewsBySlug, getMarketplaceSalesBySlug, computePriorityScore } = await import('../lib/marketplace-stats.js')
  const notionSync = await import('../lib/marketplace-notion-sync.js')
  const syncDatabaseToNotion = notionSync.default?.syncDatabaseToNotion || notionSync.syncDatabaseToNotion

  console.log('🔄 Chargement des bases marketplace + Search Console + vues...')
  let databases = []
  let videoMapping = {}
  let scData = {}
  let viewsBySlug = {}
  let salesBySlug = {}
  try {
    ;[databases, videoMapping, scData, viewsBySlug, salesBySlug] = await Promise.all([
      getAllDatabases(),
      getMarketplaceVideoMapping().catch(() => ({})),
      getSearchConsoleDataForMarketplace({ days: 365 }).catch(() => ({})),
      getMarketplaceViewsBySlug().catch(() => ({})),
      getMarketplaceSalesBySlug().catch(() => ({})),
    ])
  } catch (e) {
    console.error('❌ Erreur chargement bases:', e.message)
    process.exit(1)
  }

  if (databases.length === 0) {
    console.log('ℹ️  Aucune base à synchroniser.')
    process.exit(0)
  }

  const scCount = Object.keys(scData).length
  const salesCount = Object.keys(salesBySlug).length
  if (scCount === 0 && databases.length > 0) {
    console.warn('⚠️  Aucune donnée Search Console. Vérifiez GOOGLE_SERVICE_ACCOUNT_KEY et que le site est bien vérifié dans Search Console.')
  }
  console.log(`📋 ${databases.length} base(s), ${scCount} SC, ${Object.keys(viewsBySlug).length} vues, ${salesCount} avec ventes. Sync vers Notion${isDryRun ? ' (dry-run)' : ''}...`)

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
      const impressions = sc?.impressions ?? 0
      const clicks = sc?.clicks ?? 0
      const views = viewsBySlug[slug] || 0
      const ventes = salesBySlug[slug] || 0
      const position = sc?.position
      const score = computePriorityScore(impressions, clicks, views, !!videoMapping[slug], ventes, position)
      console.log(`  [dry-run] ${slug} | score: ${score} | ventes: ${ventes}`)
      continue
    }

    try {
      const videoUrl = videoMapping[slug] || null
      const sc = scData[slug]
      const impressions = sc?.impressions ?? 0
      const clicks = sc?.clicks ?? 0
      const position = sc?.position
      const views = viewsBySlug[slug] || 0
      const ventes = salesBySlug[slug] || 0
      const scorePriorite = computePriorityScore(impressions, clicks, views, !!videoUrl, ventes, position)
      const options = { impressions, clicks, views, ventes, scorePriorite }
      if (position != null && position > 0) options.position = position
      if (videoUrl) options.videoUrl = videoUrl
      const result = await syncDatabaseToNotion(db, options)
      if (result) {
        if (result.created) created++
        else updated++
        console.log(`  ✓ ${slug} (${result.created ? 'créé' : 'mis à jour'})`)
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
