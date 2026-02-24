/**
 * Script de synchronisation des bases marketplace vers Stripe
 *
 * Crée des Products et Prices dans Stripe pour chaque base payante,
 * afin d'utiliser optional_items (add-ons natifs) dans Checkout.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_xxx node scripts/sync-stripe-products.js
 *   node scripts/sync-stripe-products.js  # si .env configuré
 *
 * Options:
 *   --dry-run     Affiche les actions sans modifier Stripe
 *   --force       Recrée les Prices si le montant a changé (sinon réutilise)
 */

const path = require('path')
// Charger .env puis .env.local (standard Next.js)
require('dotenv').config()
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const Stripe = require('stripe')
const fs = require('fs').promises

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const forceRecreate = args.includes('--force')

const DATABASES_PATH = path.join(__dirname, '..', 'data', 'marketplace-databases.json')
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'stripe-price-ids.json')

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
  // D'abord tenter Blob Storage (source de vérité en prod)
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

  // Fallback : fichier local
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

async function findProductBySlug(stripe, slug) {
  const products = await stripe.products.list({ limit: 100, active: true })
  return products.data.find((p) => p.metadata?.slug === slug)
}

async function findPriceForAmount(stripe, productId, amountCents) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
  })
  return prices.data.find((p) => p.unit_amount === amountCents && !p.recurring)
}

async function run() {
  if (!process.env.STRIPE_SECRET_KEY && !isDryRun) {
    log('❌ STRIPE_SECRET_KEY manquant. Ajoutez-le dans .env ou en variable d\'environnement.', 'red')
    process.exit(1)
  }

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
    : null

  log('📦 Synchronisation Stripe Products / Prices', 'cyan')
  if (isDryRun) log('   Mode dry-run (aucune modification)', 'yellow')
  console.log('')

  const databases = await loadDatabases()
  const paid = databases.filter((d) => d.isPaid && d.price != null)
  log(`Bases payantes à synchroniser : ${paid.length}`, 'cyan')

  const mapping = await getExistingMapping()
  const updated = { ...mapping }

  for (const db of paid) {
    const slug = db.slug
    const amountCents = Math.round(db.price * 100)

    log(`  • ${db.name} (${db.slug}) - ${db.price}€`, 'reset')

    if (isDryRun) {
      const existing = mapping[slug]
      if (existing?.priceId) {
        log(`    → Price existant : ${existing.priceId}`, 'yellow')
      } else {
        log(`    → Serait créé : Product + Price (${db.price}€)`, 'green')
      }
      continue
    }

    try {
      let product = await findProductBySlug(stripe, slug)
      let priceId = null

      if (product) {
        let price = await findPriceForAmount(stripe, product.id, amountCents)
        if (price) {
          priceId = price.id
          log(`    ✓ Réutilisé : ${priceId}`, 'green')
        } else if (forceRecreate) {
          const newPrice = await stripe.prices.create({
            product: product.id,
            currency: 'eur',
            unit_amount: amountCents,
            tax_behavior: 'inclusive',
            metadata: { slug },
          })
          priceId = newPrice.id
          log(`    ✓ Nouveau prix (montant changé) : ${priceId}`, 'green')
        } else {
          price = (await stripe.prices.list({ product: product.id, active: true })).data[0]
          priceId = price?.id
          if (priceId) {
            log(`    ⚠ Réutilise prix existant (${priceId}) - montant différent, utilisez --force pour recréer`, 'yellow')
          }
        }
      } else {
        product = await stripe.products.create({
          name: `${db.name} - Achat unique`,
          description: (db.shortDescription || db.description || '').slice(0, 500),
          metadata: { slug },
        })
        const price = await stripe.prices.create({
          product: product.id,
          currency: 'eur',
          unit_amount: amountCents,
          tax_behavior: 'inclusive',
          metadata: { slug },
        })
        priceId = price.id
        log(`    ✓ Créé : ${product.id} / ${priceId}`, 'green')
      }

      if (priceId) {
        updated[slug] = {
          productId: product.id,
          priceId,
          name: db.name,
          price: db.price,
          updatedAt: new Date().toISOString(),
        }
      }
    } catch (err) {
      log(`    ❌ Erreur : ${err.message}`, 'red')
    }
  }

  if (!isDryRun && Object.keys(updated).length > 0) {
    const json = JSON.stringify(updated, null, 2)
    await fs.writeFile(OUTPUT_PATH, json, 'utf8')
    log(`\n✓ Mapping sauvegardé dans data/stripe-price-ids.json`, 'green')

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = require('@vercel/blob')
        await put('stripe-price-ids.json', json, { access: 'public' })
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
