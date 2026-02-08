/**
 * Script pour générer des données de démo réelles depuis Apify
 * 
 * Ce script :
 * 1. Lance un acteur Apify avec un input de test
 * 2. Récupère les résultats
 * 3. Stocke les 5 premiers résultats dans Blob Storage pour la démo
 * 
 * Usage:
 *   node scripts/generate-apify-demo-data.js
 *   node scripts/generate-apify-demo-data.js --actor=corent1robert/airbnb-professional-host-scraper --city=Paris
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const { ApifyClient } = require('apify-client')
const { put, list } = require('@vercel/blob')
const path = require('path')

const BLOB_FILENAME = 'apify-demo-data.json'
const USERNAME = 'corent1robert'

// Couleurs
const green = (text) => `\x1b[32m${text}\x1b[0m`
const yellow = (text) => `\x1b[33m${text}\x1b[0m`
const blue = (text) => `\x1b[36m${text}\x1b[0m`
const red = (text) => `\x1b[31m${text}\x1b[0m`

// Parse arguments
const args = process.argv.slice(2)
const actorArg = args.find(arg => arg.startsWith('--actor='))
const cityArg = args.find(arg => arg.startsWith('--city='))
const actorId = actorArg ? actorArg.split('=')[1] : 'corent1robert/airbnb-professional-host-scraper'
const testCity = cityArg ? cityArg.split('=')[1] : 'Paris'

async function generateDemoData() {
  console.log(blue('\n🚀 Génération de données de démo Apify\n'))
  
  if (!process.env.APIFY_API_TOKEN) {
    console.error(red('❌ APIFY_API_TOKEN non défini dans .env.local'))
    process.exit(1)
  }

  const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN
  })

  try {
    console.log(blue(`📋 Acteur: ${actorId}`))
    console.log(blue(`🏙️  Ville de test: ${testCity}`))

    // Préparer l'input selon le type d'acteur
    let input = {}
    if (actorId.includes('airbnb-professional-host-scraper')) {
      input = {
        city: [testCity],
        maxPages: 1, // Limiter à 1 page pour la démo
        onlyProHosts: true
      }
    } else if (actorId.includes('airbnb-property-scraper')) {
      input = {
        city: [testCity],
        maxPages: 1
      }
    } else if (actorId.includes('airbnb-review')) {
      // Pour les reviews, on a besoin d'une URL
      input = {
        listingUrl: 'https://www.airbnb.com/rooms/46034337' // Exemple d'URL Airbnb
      }
    } else {
      // Input générique
      input = {
        city: testCity
      }
    }

    console.log(yellow('⏳ Lancement de l\'acteur...'))
    const run = await client.actor(actorId).call(input, {
      timeout: 300, // 5 minutes max
      memory: 2048
    })
    
    // Attendre que le run soit terminé (max 2 minutes)
    console.log(yellow('⏳ Attente de la fin de l\'exécution...'))
    let runStatus = await client.run(run.id).get()
    let attempts = 0
    const maxAttempts = 24 // 2 minutes max (5 secondes * 24)
    
    while (runStatus.status !== 'SUCCEEDED' && runStatus.status !== 'FAILED' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Attendre 5 secondes
      runStatus = await client.run(run.id).get()
      attempts++
      if (attempts % 4 === 0) {
        console.log(yellow(`   Statut: ${runStatus.status}...`))
      }
    }
    
    if (runStatus.status === 'FAILED') {
      throw new Error(`Le run a échoué: ${runStatus.statusMessage || 'Erreur inconnue'}`)
    }
    
    if (runStatus.status !== 'SUCCEEDED') {
      console.warn(yellow(`⚠️  Le run n'est pas terminé (${runStatus.status}), mais on récupère les résultats disponibles`))
    }

    console.log(green(`✅ Run terminé: ${run.id}`))

    // Récupérer les résultats
    console.log(yellow('📥 Récupération des résultats...'))
    const { items } = await client.dataset(run.defaultDatasetId).listItems({
      limit: 5, // Seulement les 5 premiers pour la démo
      clean: true
    })

    if (!items || items.length === 0) {
      console.warn(yellow('⚠️  Aucun résultat trouvé'))
      return
    }

    console.log(green(`✅ ${items.length} résultat(s) récupéré(s)`))

    // Charger les données existantes
    let demoData = {}
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blobs = await list({ prefix: BLOB_FILENAME })
        const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)
        
        if (existingBlob) {
          const response = await fetch(existingBlob.url, {
            method: 'GET',
            cache: 'no-store',
          })
          
          if (response.ok) {
            demoData = await response.json()
          }
        }
      } catch (error) {
        console.warn(yellow('⚠️  Erreur chargement données existantes, création nouvelle structure'))
      }
    }

    // Stocker les données de démo pour cet acteur
    const actorSlug = actorId.split('/').pop()
    demoData[actorSlug] = {
      items: items,
      input: input,
      runId: run.id,
      datasetId: run.defaultDatasetId,
      generatedAt: new Date().toISOString(),
      testCity: testCity
    }

    // Sauvegarder dans Blob Storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(BLOB_FILENAME, JSON.stringify(demoData, null, 2), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true
      })
      console.log(green(`✅ Données de démo sauvegardées dans Blob Storage pour ${actorSlug}`))
    } else {
      // Fallback: sauvegarder localement
      const localFile = path.join(__dirname, '..', 'data', BLOB_FILENAME)
      const fs = require('fs').promises
      await fs.mkdir(path.dirname(localFile), { recursive: true })
      await fs.writeFile(localFile, JSON.stringify(demoData, null, 2), 'utf8')
      console.log(green(`✅ Données de démo sauvegardées localement pour ${actorSlug}`))
    }

    console.log(green(`\n✅ Données de démo générées avec succès pour ${actorSlug}`))
    console.log(blue(`   ${items.length} résultat(s) stocké(s)`))
    console.log(blue(`   Input utilisé: ${JSON.stringify(input)}`))

  } catch (error) {
    console.error(red('❌ Erreur:'), error.message)
    if (error.stack) {
      console.error(red('Stack:'), error.stack)
    }
    process.exit(1)
  }
}

// Exécuter
generateDemoData()
