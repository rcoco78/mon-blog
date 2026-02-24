/**
 * Cron Vercel : synchronisation des bases marketplace vers Stripe
 *
 * Crée ou met à jour les Products et Prices Stripe pour chaque base payante.
 * Sauvegarde le mapping (slug → priceId) dans Blob pour create-checkout.
 *
 * Planification : 1x/jour (vercel.json)
 * Variables requises : STRIPE_SECRET_KEY, BLOB_READ_WRITE_TOKEN, CRON_SECRET
 */

import Stripe from 'stripe'
import { list, put } from '@vercel/blob'

const BLOB_MARKETPLACE = 'marketplace-databases.json'
const BLOB_STRIPE_IDS = 'stripe-price-ids.json'

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

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: 'STRIPE_SECRET_KEY non configuré',
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
    console.log('🚀 Cron sync-stripe-products : démarrage')

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })

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

    const paid = databases.filter((d) => d.isPaid && d.price != null)
    console.log(`   Bases payantes : ${paid.length}`)

    // Charger le mapping existant depuis Blob
    let mapping = {}
    const blobsMap = await list({ prefix: BLOB_STRIPE_IDS })
    const blobMap = blobsMap.blobs.find((b) => b.pathname === BLOB_STRIPE_IDS)
    if (blobMap) {
      const resMap = await fetch(blobMap.url, { cache: 'no-store' })
      if (resMap.ok) {
        mapping = await resMap.json()
      }
    }

    const updated = { ...mapping }

    for (const db of paid) {
      const slug = db.slug
      const amountCents = Math.round(db.price * 100)

      try {
        const products = await stripe.products.list({ limit: 100, active: true })
        let product = products.data.find((p) => p.metadata?.slug === slug)
        let priceId = null

        if (product) {
          const prices = await stripe.prices.list({ product: product.id, active: true })
          let price = prices.data.find((p) => p.unit_amount === amountCents && !p.recurring)
          if (price) {
            priceId = price.id
          } else {
            price = prices.data[0]
            if (price) priceId = price.id
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
        console.error(`   Erreur ${slug}:`, err.message)
      }
    }

    await put(BLOB_STRIPE_IDS, JSON.stringify(updated, null, 2), { access: 'public' })

    console.log(`✅ Cron sync-stripe-products : ${Object.keys(updated).length} produits dans Blob`)

    return res.status(200).json({
      success: true,
      productsCount: Object.keys(updated).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Cron sync-stripe-products:', error)
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
