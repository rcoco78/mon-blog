/**
 * Cron Vercel : synchronisation des bases marketplace vers Gumroad
 *
 * Crée ou met à jour les produits Gumroad pour chaque base (payante + gratuite).
 * Description markdown riche générée depuis les données enrichies.
 * URL de livraison = sheetUrl/copy (lien Copy du Google Sheet).
 *
 * Planification : 1x/jour (vercel.json)
 * Variables requises : GUMROAD_ACCESS_TOKEN, BLOB_READ_WRITE_TOKEN, CRON_SECRET
 */

import { list, put } from '@vercel/blob'

const BLOB_MARKETPLACE = 'marketplace-databases.json'
const BLOB_GUMROAD_IDS = 'gumroad-product-ids.json'

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const hasValidSecret = process.env.CRON_SECRET
    ? req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
    : false

  if (!isVercelCron && !hasValidSecret) {
    return res.status(401).json({
      message: 'Unauthorized',
      hint: 'Appel réservé à Vercel Cron. Utilisez CRON_SECRET pour tester manuellement.',
    })
  }

  if (!process.env.GUMROAD_ACCESS_TOKEN) {
    return res.status(500).json({
      error: 'GUMROAD_ACCESS_TOKEN non configuré',
      timestamp: new Date().toISOString(),
    })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN non configuré',
      timestamp: new Date().toISOString(),
    })
  }

  try {
    console.log('🚀 Cron sync-gumroad-products : démarrage')

    const { createOrUpdateGumroadProduct } = await import('../../../lib/marketplace-gumroad-sync')

    // Charger les bases depuis Blob
    const blobsDb = await list({ prefix: BLOB_MARKETPLACE })
    const blobDb = blobsDb.blobs.find((b) => b.pathname === BLOB_MARKETPLACE)
    if (!blobDb) {
      return res.status(500).json({
        error: 'marketplace-databases.json introuvable dans Blob',
        timestamp: new Date().toISOString(),
      })
    }
    const resDb = await fetch(blobDb.url, { cache: 'no-store' })
    const dataDb = await resDb.json()
    const databases = dataDb.databases ?? (Array.isArray(dataDb) ? dataDb : [])

    console.log(`   Bases à synchroniser : ${databases.length}`)

    // Charger le mapping existant depuis Blob
    let mapping = {}
    const blobsMap = await list({ prefix: BLOB_GUMROAD_IDS })
    const blobMap = blobsMap.blobs.find((b) => b.pathname === BLOB_GUMROAD_IDS)
    if (blobMap) {
      const resMap = await fetch(blobMap.url, { cache: 'no-store' })
      if (resMap.ok) {
        mapping = await resMap.json()
      }
    }

    const updated = { ...mapping }

    for (let i = 0; i < databases.length; i++) {
      const db = databases[i]
      const slug = db.slug

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
          console.log(`   ✓ ${slug}: ${result.created ? 'créé' : 'mis à jour'}`)
        }
      } catch (err) {
        console.error(`   Erreur ${slug}:`, err.message)
      }

      // Rate limiting
      if (i < databases.length - 1) {
        await new Promise((r) => setTimeout(r, 800))
      }
    }

    await put(BLOB_GUMROAD_IDS, JSON.stringify(updated, null, 2), {
      access: 'public',
      allowOverwrite: true,
    })

    console.log(`✅ Cron sync-gumroad-products : ${Object.keys(updated).length} produits dans Blob`)

    return res.status(200).json({
      success: true,
      productsCount: Object.keys(updated).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Cron sync-gumroad-products:', error)
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
