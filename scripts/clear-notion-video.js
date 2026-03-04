/**
 * Efface la Vidéo Tella pour une base marketplace dans Notion
 *
 * Usage:
 *   node scripts/clear-notion-video.js <slug>
 *   node scripts/clear-notion-video.js restaurants-tripadvisor-uk-base-donnees
 *
 * Prérequis : NOTION_TOKEN, NOTION_VIDEO_STRATEGY_DATABASE_ID (optionnel)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: node scripts/clear-notion-video.js <slug>')
    process.exit(1)
  }

  if (!process.env.NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN requis. Configurez .env.local')
    process.exit(1)
  }

  const { clearNotionVideoUrl } = require('../lib/marketplace-notion-sync')
  const ok = await clearNotionVideoUrl(slug)
  if (ok) {
    console.log(`✅ Vidéo Tella effacée pour: ${slug}`)
  } else {
    console.error(`❌ Échec ou ligne introuvable pour: ${slug}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
