/**
 * Export des descriptions Gumroad pour création manuelle
 *
 * L'API Gumroad ne supporte PAS la création de produits (POST 404).
 * Ce script génère des fichiers prêts à copier-coller dans le dashboard Gumroad.
 *
 * Usage: node scripts/export-gumroad-descriptions.js
 * Output: data/gumroad-export/
 */

const path = require('path')
const fs = require('fs').promises
const { buildGumroadDescription } = require('../lib/marketplace-gumroad-sync')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'gumroad-export')
const EUR_TO_USD = parseFloat(process.env.GUMROAD_EUR_TO_USD || '1.08') || 1.08

async function loadDatabases() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = require('@vercel/blob')
      const blobs = await list({ prefix: 'marketplace-databases.json' })
      const blob = blobs.blobs.find((b) => b.pathname === 'marketplace-databases.json')
      if (blob) {
        const res = await fetch(blob.url, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const arr = data.databases ?? (Array.isArray(data) ? data : [])
          if (arr.length > 0) return arr
        }
      }
    } catch (_) {}
  }
  const raw = await fs.readFile(path.join(__dirname, '..', 'data', 'marketplace-databases.json'), 'utf8')
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : data.databases || []
}

async function main() {
  console.log('📤 Export Gumroad - génération des descriptions pour création manuelle\n')

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const databases = await loadDatabases()
  console.log(`Bases à exporter : ${databases.length}\n`)

  const summary = []
  for (const db of databases) {
    const description = buildGumroadDescription(db)
    const priceEur = db.isPaid && db.price != null ? db.price : 0
    const priceUsd = (priceEur * EUR_TO_USD).toFixed(2)
    const deliveryUrl = (db.sheetUrl || '').replace(/\/$/, '') + '/copy'

    const product = {
      name: db.name,
      slug: db.slug,
      priceEur,
      priceUsd,
      priceUsdCents: Math.round(priceEur * EUR_TO_USD * 100),
      deliveryUrl,
      description,
      category: db.category,
    }

    summary.push({
      slug: db.slug,
      name: db.name,
      priceUsd,
      priceUsdCents: product.priceUsdCents,
    })

    const filename = `${db.slug}.json`
    await fs.writeFile(
      path.join(OUTPUT_DIR, filename),
      JSON.stringify(product, null, 2),
      'utf8'
    )
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, '_INDEX.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  )

  console.log(`✅ Export terminé dans data/gumroad-export/`)
  console.log(`   - ${databases.length} fichiers JSON (un par base)`)
  console.log(`   - _INDEX.json : liste récapitulative`)
  console.log(`\nPour créer manuellement sur Gumroad :`)
  console.log(`1. Ouvre gumroad.com/products/new`)
  console.log(`2. Pour chaque base : copie name, price (USD), description, url depuis le fichier JSON`)
  console.log(`3. Ou importe le contenu via un outil de ton choix\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
