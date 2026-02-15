#!/usr/bin/env node
/**
 * Test de connexion à l'API Google Search Console
 *
 * Prérequis :
 * 1. Search Console API activée dans Google Cloud
 * 2. service-account-key.json à la racine du projet
 * 3. L'email du service account (client_email dans le JSON) ajouté comme
 *    utilisateur dans Search Console : Paramètres > Utilisateurs et autorisations
 *
 * Usage: node scripts/test-search-console.js
 */

const { google } = require('googleapis')
const fs = require('fs').promises
const path = require('path')

// Propriété "Domaine" dans Search Console (pas "Préfixe d'URL")
const SITE_URL = 'sc-domain:corentinrobert.fr'

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('\n🔍 Test Search Console API\n')

  const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json')
  if (!(await fileExists(serviceAccountPath))) {
    console.error('❌ Fichier service-account-key.json introuvable à la racine du projet.')
    process.exit(1)
  }

  const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'))
  console.log('   Service account:', serviceAccount.client_email)

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })

  const client = google.searchconsole({ version: 'v1', auth })

  // 0) Lister les propriétés accessibles (diagnostic)
  console.log('📋 Propriétés Search Console accessibles au service account...')
  try {
    const { data } = await client.sites.list()
    const sites = data.siteEntry || []
    if (sites.length === 0) {
      console.log('   ⚠️  Aucune propriété trouvée ! Le service account n\'a accès à rien.')
      console.log(`
   Vérifie dans Search Console :
   1. Paramètres > Utilisateurs et autorisations
   2. L'email ${serviceAccount.client_email} est bien dans la liste
   3. Tu as ajouté l'utilisateur sur la BONNE propriété (celle où tu vois tes données)
   4. Permission "Propriétaire" ou "Utilisateur complet" (pas uniquement "Restreinte" parfois)
   5. Si tu as plusieurs propriétés (www, non-www, domaine), ajoute sur chacune si besoin
`)
      process.exit(1)
    }
    sites.forEach((s, i) => console.log(`   ${i + 1}. ${s.siteUrl}`))
    console.log()
  } catch (listErr) {
    console.log('   Erreur sites.list:', listErr.message)
  }

  // Période : 90 derniers jours (3 mois)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)

  const startStr = startDate.toISOString().slice(0, 10)
  const endStr = endDate.toISOString().slice(0, 10)

  console.log(`   Site: ${SITE_URL}`)
  console.log(`   Période: ${startStr} → ${endStr}\n`)

  try {
    // 1) Requête globale (clics, impressions, CTR, position)
    console.log('📊 Requête globale...')
    const global = await client.searchanalytics.query({
      requestBody: {
        startDate: startStr,
        endDate: endStr,
      },
      siteUrl: SITE_URL,
    })

    const rows = global.data?.rows || []
    if (rows.length === 0) {
      console.log('   Aucune donnée brute (agrégée). Passage au détail par page.\n')
    } else {
      const totals = rows[0]
      console.log('   ✅ Connexion OK !')
      console.log('   Clics:', totals.clicks)
      console.log('   Impressions:', totals.impressions)
      console.log('   CTR:', ((totals.ctr || 0) * 100).toFixed(2) + '%')
      console.log('   Position moyenne:', (totals.position || 0).toFixed(1))
      console.log()
    }

    // 2) Top 5 pages par clics
    console.log('📄 Top 5 pages par clics...')
    const byPage = await client.searchanalytics.query({
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ['page'],
        rowLimit: 5,
      },
      siteUrl: SITE_URL,
    })

    const pageRows = byPage.data?.rows || []
    if (pageRows.length === 0) {
      console.log('   Aucune page avec données.\n')
    } else {
      pageRows.forEach((row, i) => {
        const fullPath = row.keys?.[0] || '-'
        const p = fullPath.replace(/^https?:\/\/[^/]+/, '') || fullPath
        console.log(`   ${i + 1}. ${p} | ${row.clicks} clics | ${row.impressions} imp.`)
      })
      console.log()
    }

    // 3) Top 5 requêtes par impressions
    console.log('🔑 Top 5 requêtes par impressions...')
    const byQuery = await client.searchanalytics.query({
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ['query'],
        rowLimit: 5,
      },
      siteUrl: SITE_URL,
    })

    const queryRows = byQuery.data?.rows || []
    if (queryRows.length === 0) {
      console.log('   Aucune requête.\n')
    } else {
      queryRows.forEach((row, i) => {
        const q = row.keys?.[0] || '-'
        console.log(`   ${i + 1}. "${q}" | pos ${(row.position || 0).toFixed(0)} | ${row.clicks} clics | ${row.impressions} imp.`)
      })
      console.log()
    }

    console.log('✅ Test Search Console réussi !')
  } catch (err) {
    console.error('❌ Erreur Search Console:', err.message)

    if (err.code === 403 || err.message?.includes('403')) {
      console.log(`
💡 Si tu as une erreur 403, vérifie que :
   1. Le Service Account est ajouté dans Search Console :
      → search.google.com/search-console
      → Paramètres (⚙️) > Utilisateurs et autorisations
      → Ajouter un utilisateur
      → Colle l'email : ${serviceAccount.client_email}
      → Permission : Restreinte (lecture) ou Propriétaire

   2. La propriété correspond bien à ton site dans Search Console
      (https://www.corentinrobert.fr ou sc-domain:corentinrobert.fr)
`)
    }
    process.exit(1)
  }
}

main()
