/**
 * Script de synchronisation des bases marketplace vers Gumroad
 *
 * LIMITATION : L'API Gumroad ne supporte pas la création de produits (POST 404).
 * Ce script tente la sync mais échouera. Utilisez export-gumroad-descriptions
 * pour générer les données et créer les produits manuellement sur gumroad.com
 *
 * Usage:
 *   node scripts/sync-gumroad-products.js
 *   node scripts/export-gumroad-descriptions.js  # recommandé : export pour création manuelle
 *
 * Options:
 *   --dry-run     Affiche les actions sans modifier Gumroad
 *   --slug=xxx    Sync une seule base par slug
 */

const path = require('path')
const projectRoot = path.join(__dirname, '..')
require('dotenv').config({ path: path.join(projectRoot, '.env') })
require('dotenv').config({ path: path.join(projectRoot, '.env.local'), override: true })
const fs = require('fs').promises
const { createOrUpdateGumroadProduct } = require('../lib/marketplace-gumroad-sync')

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const slugFilter = args.find((a) => a.startsWith('--slug='))?.split('=')[1]

const DATABASES_PATH = path.join(__dirname, '..', 'data', 'marketplace-databases.json')
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'gumroad-product-ids.json')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}
function log(msg, c = 'reset') {
  console.log(`${colors[c]}${msg}${colors.reset}`)
}

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
          if (arr.length > 0) {
            log(`   Source : Vercel Blob (${arr.length} bases)`, 'cyan')
            return arr
          }
        }
      }
    } catch (e) {
      log(`   ⚠ Blob inaccessible : ${e.message} → fallback fichier local`, 'yellow')
    }
  }

  const raw = await fs.readFile(DATABASES_PATH, 'utf8')
  const data = JSON.parse(raw)
  const arr = Array.isArray(data) ? data : data.databases || []
  log(`   Source : fichier local (${arr.length} bases)`, 'cyan')
  return arr
}

async function getExistingMapping() {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function run() {
  if (!process.env.GUMROAD_ACCESS_TOKEN && !isDryRun) {
    log('❌ GUMROAD_ACCESS_TOKEN manquant.', 'red')
    log('   Ajoutez GUMROAD_ACCESS_TOKEN=xxx dans .env.local (à la racine du projet)', 'yellow')
    log('   Ou lancez : GUMROAD_ACCESS_TOKEN=xxx npm run sync-gumroad-products', 'yellow')
    process.exit(1)
  }

  log('🛒 Synchronisation Gumroad Products', 'cyan')
  if (isDryRun) log('   Mode dry-run (aucune modification)', 'yellow')
  if (slugFilter) log(`   Filtre slug : ${slugFilter}`, 'yellow')
  console.log('')

  let databases = await loadDatabases()
  if (slugFilter) {
    databases = databases.filter((d) => d.slug === slugFilter)
    if (databases.length === 0) {
      log(`Aucune base trouvée pour le slug "${slugFilter}"`, 'red')
      process.exit(1)
    }
  }

  log(`Bases à synchroniser : ${databases.length}`, 'cyan')

  const mapping = await getExistingMapping()
  const updated = { ...mapping }

  for (let i = 0; i < databases.length; i++) {
    const db = databases[i]
    const slug = db.slug
    const priceStr = db.isPaid && db.price != null ? `${db.price}€` : 'gratuit'

    log(`  • [${i + 1}/${databases.length}] ${db.name} (${slug}) - ${priceStr}`, 'reset')

    if (isDryRun) {
      const existing = mapping[slug]
      if (existing?.productId) {
        log(`    → Produit existant : ${existing.productId}`, 'yellow')
      } else {
        log(`    → Serait créé sur Gumroad`, 'green')
      }
      continue
    }

    try {
      const result = await createOrUpdateGumroadProduct(db, updated)
      if (result) {
        updated[slug] = {
          productId: result.productId,
          permalink: result.permalink,
          name: db.name,
          price: db.isPaid ? db.price : 0,
          updatedAt: new Date().toISOString(),
          created: result.created,
        }
        log(`    ✓ ${result.created ? 'Créé' : 'Mis à jour'} : ${result.productId}`, 'green')
      } else {
        log(`    ⚠ Sync skipped (erreur ou token manquant)`, 'yellow')
      }
    } catch (err) {
      log(`    ❌ Erreur : ${err.message}`, 'red')
    }

    // Rate limiting : pause entre chaque appel
    if (i < databases.length - 1 && !isDryRun) {
      await new Promise((r) => setTimeout(r, 800))
    }
  }

  if (!isDryRun && Object.keys(updated).length > 0) {
    const json = JSON.stringify(updated, null, 2)
    await fs.writeFile(OUTPUT_PATH, json, 'utf8')
    log(`\n✓ Mapping sauvegardé dans data/gumroad-product-ids.json`, 'green')

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = require('@vercel/blob')
        await put('gumroad-product-ids.json', json, { access: 'public' })
        log(`✓ Mapping aussi sauvegardé dans Vercel Blob`, 'green')
      } catch (e) {
        log(`⚠ Blob non mis à jour : ${e.message}`, 'yellow')
      }
    }
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
