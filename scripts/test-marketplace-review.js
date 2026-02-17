#!/usr/bin/env node
/**
 * Test de soumission d'un avis marketplace
 * Usage: node scripts/test-marketplace-review.js
 *        BASE_URL=http://localhost:3001 node scripts/test-marketplace-review.js
 * Nécessite: serveur dev (npm run dev), MARKETPLACE_REVIEW_REF et BLOB_READ_WRITE_TOKEN dans .env.local
 */
require('dotenv').config({ path: '.env.local' })

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const REF = process.env.MARKETPLACE_REVIEW_REF

async function main() {
  if (!REF) {
    console.error('❌ MARKETPLACE_REVIEW_REF manquant dans .env.local')
    process.exit(1)
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('⚠️  BLOB_READ_WRITE_TOKEN manquant — l\'enregistrement peut échouer (erreur 500)')
    console.warn('   Récupérez-le dans Vercel → Storage → Blob')
  }

  const payload = {
    ref: REF,
    authorName: 'Test Client Script',
    email: 'test@example.com',
    linkedinUrl: 'https://www.linkedin.com/in/robertcorentin/',
    productSlug: 'agences-immobilieres-notaires-france',
    productName: 'Base de données - Agences immobilières et notaires en France',
    reviewBody: 'Test automatique : livraison rapide, données exploitables. Je recommande !'
  }

  console.log('📤 Envoi POST vers', `${BASE}/api/marketplace-reviews`)
  console.log('Payload:', JSON.stringify(payload, null, 2))

  try {
    const res = await fetch(`${BASE}/api/marketplace-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (res.ok) {
      console.log('✅ Succès:', data)
    } else {
      console.error('❌ Erreur', res.status, ':', data.error || data)
      process.exit(1)
    }
  } catch (err) {
    console.error('❌ Erreur réseau:', err.message)
    console.log('💡 Assurez-vous que le serveur tourne (npm run dev) et que le port est correct.')
    process.exit(1)
  }
}

main()
