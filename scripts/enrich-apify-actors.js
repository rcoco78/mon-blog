/**
 * Script d'enrichissement des Actors Apify avec GPT-4o mini
 * 
 * Ce script :
 * 1. Récupère les actors Apify publiés d'un utilisateur
 * 2. Compare avec ceux déjà enregistrés
 * 3. Utilise GPT-4o mini pour enrichir les nouveaux actors
 * 4. Génère des descriptions, cas d'usage, problèmes/solutions
 * 5. Sauvegarde les métadonnées enrichies dans Blob Storage
 * 
 * Usage:
 *   node scripts/enrich-apify-actors.js
 *   node scripts/enrich-apify-actors.js --actor-id=corent1robert/airbnb-scraper
 *   node scripts/enrich-apify-actors.js --all
 */

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const fs = require('fs').promises
const path = require('path')
const OpenAI = require('openai')
const { put, list } = require('@vercel/blob')

const ACTORS_FILE = path.join(__dirname, '..', 'data', 'apify-actors.json')
const BLOB_FILENAME = 'apify-actors.json'
const USERNAME = 'corent1robert'

// Couleurs
const green = (text) => `\x1b[32m${text}\x1b[0m`
const yellow = (text) => `\x1b[33m${text}\x1b[36m`
const blue = (text) => `\x1b[36m${text}\x1b[0m`
const red = (text) => `\x1b[31m${text}\x1b[0m`
const cyan = (text) => `\x1b[36m${text}\x1b[0m`

// Parse arguments
const args = process.argv.slice(2)
const actorIdArg = args.find(arg => arg.startsWith('--actor-id='))
const actorId = actorIdArg ? actorIdArg.split('=')[1] : null
const allActors = args.includes('--all')

// Initialiser OpenAI
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
} else {
  console.log(yellow('⚠️  OPENAI_API_KEY non définie. L\'enrichissement GPT sera désactivé.'))
}

// Liste statique des actors (basée sur le MCP Apify)
// Dans le futur, on pourra utiliser l'API Apify directement
const STATIC_ACTORS = [
  {
    id: 'corent1robert/airbnb-professional-host-scraper',
    username: 'corent1robert',
    name: 'airbnb-professional-host-scraper',
    title: 'Airbnb Pro Host Business Email Scraper',
    description: '🚀 High-performance Airbnb scraper for B2B lead generation. Extracts professional host business information including company names, email addresses, phone numbers, and registration details.',
    stats: { runs: 0, users: 63, successRate: 83.1 },
    url: 'https://apify.com/corent1robert/airbnb-professional-host-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/airbnb-property-scraper',
    username: 'corent1robert',
    name: 'airbnb-property-scraper',
    title: 'Airbnb Property Scraper',
    description: 'High-performance Airbnb property data scraper with optimized pagination and memory management.',
    stats: { runs: 0, users: 14, successRate: 95.5 },
    url: 'https://apify.com/corent1robert/airbnb-property-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/airbnb-reviews-scraper',
    username: 'corent1robert',
    name: 'airbnb-reviews-scraper',
    title: 'Airbnb Reviews Scraper',
    description: 'Automatically collects Airbnb reviews from any listing URL. Retrieves the reviewer\'s name, rating, date, and comment.',
    stats: { runs: 0, users: 13, successRate: 92.6 },
    url: 'https://apify.com/corent1robert/airbnb-reviews-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/era-immobilier-scraper',
    username: 'corent1robert',
    name: 'era-immobilier-scraper',
    title: 'Era Immobilier Scraper',
    description: 'Extract comprehensive data from ERA Immobilier agencies including agency information and agent details.',
    stats: { runs: 0, users: 2, successRate: 92.9 },
    url: 'https://apify.com/corent1robert/era-immobilier-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/cote-particuliers-scraper',
    username: 'corent1robert',
    name: 'cote-particuliers-scraper',
    title: 'Cote Particuliers Scraper',
    description: 'Extract comprehensive data from Côté Particuliers agencies including agency information and collaborator details.',
    stats: { runs: 0, users: 2, successRate: 100.0 },
    url: 'https://apify.com/corent1robert/cote-particuliers-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/keymex-scraper',
    username: 'corent1robert',
    name: 'keymex-scraper',
    title: 'Keymex Scraper',
    description: 'Extract comprehensive data from Keymex centers including center information and collaborator details.',
    stats: { runs: 0, users: 2, successRate: 100.0 },
    url: 'https://apify.com/corent1robert/keymex-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/lgm-immobilier-scraper',
    username: 'corent1robert',
    name: 'lgm-immobilier-scraper',
    title: 'Lgm Immobilier Scraper',
    description: 'Extract comprehensive data from LGM Immobilier advisors including contact details, location data, and professional information.',
    stats: { runs: 0, users: 2, successRate: 100.0 },
    url: 'https://apify.com/corent1robert/lgm-immobilier-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/actulegales-scraper',
    username: 'corent1robert',
    name: 'actulegales-scraper',
    title: 'Actulegales Scraper',
    description: 'Extract comprehensive legal announcements from Actulegales.fr.',
    stats: { runs: 0, users: 2, successRate: 91.7 },
    url: 'https://apify.com/corent1robert/actulegales-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/reseau-expertimo-scraper',
    username: 'corent1robert',
    name: 'reseau-expertimo-scraper',
    title: 'Reseau Expertimo Scraper',
    description: 'Extract comprehensive data from Reseau Expertimo agencies and mandataires including contact details, location data, and professional information.',
    stats: { runs: 0, users: 2, successRate: 100.0 },
    url: 'https://apify.com/corent1robert/reseau-expertimo-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/ikami-scraper',
    username: 'corent1robert',
    name: 'ikami-scraper',
    title: 'Ikami Scraper',
    description: 'Extract comprehensive data from Ikami advisors including advisor information, contact details, location data, and number of active listings.',
    stats: { runs: 0, users: 2, successRate: 100.0 },
    url: 'https://apify.com/corent1robert/ikami-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/investorlift-scraper',
    username: 'corent1robert',
    name: 'investorlift-scraper',
    title: 'Investorlift Scraper',
    description: 'Extract comprehensive data from InvestorLift marketplace properties including property details, pricing, location data, and account information.',
    stats: { runs: 0, users: 2, successRate: 0.0 },
    url: 'https://apify.com/corent1robert/investorlift-scraper',
    isPublic: true
  },
  {
    id: 'corent1robert/startupticker-scraper',
    username: 'corent1robert',
    name: 'startupticker-scraper',
    title: 'Startupticker.ch Investors Scraper',
    description: 'Extract comprehensive investor data from startupticker.ch, Switzerland\'s leading startup ecosystem directory.',
    stats: { runs: 0, users: 2, successRate: 0.0 },
    url: 'https://apify.com/corent1robert/startupticker-scraper',
    isPublic: true
  }
]

// Charger les actors depuis Blob Storage ou fichier local
async function loadActors() {
  // Essayer Blob Storage d'abord
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
          const data = await response.json()
          if (data.actors && Array.isArray(data.actors)) {
            console.log(cyan(`  ✓ ${data.actors.length} actors chargés depuis Blob Storage`))
            return data.actors
          }
        }
      }
    } catch (error) {
      console.warn(yellow(`  ⚠️ Erreur Blob Storage, fallback fichier local: ${error.message}`))
    }
  }

  // Fallback vers fichier local
  try {
    if (await fileExists(ACTORS_FILE)) {
      const data = JSON.parse(await fs.readFile(ACTORS_FILE, 'utf8'))
      if (data.actors && Array.isArray(data.actors)) {
        console.log(cyan(`  ✓ ${data.actors.length} actors chargés depuis fichier local`))
        return data.actors
      }
    }
  } catch (error) {
    console.warn(yellow(`  ⚠️ Erreur lecture fichier local: ${error.message}`))
  }

  return []
}

// Sauvegarder les actors dans Blob Storage et fichier local
async function saveActors(actors) {
  const data = { actors, lastUpdated: new Date().toISOString() }

  // Sauvegarder dans Blob Storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true
      })
      console.log(green(`  ✓ Actors sauvegardés dans Blob Storage`))
    } catch (error) {
      console.error(red(`  ❌ Erreur sauvegarde Blob Storage: ${error.message}`))
    }
  }

  // Sauvegarder localement aussi
  try {
    const dir = path.dirname(ACTORS_FILE)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(ACTORS_FILE, JSON.stringify(data, null, 2), 'utf8')
    console.log(green(`  ✓ Actors sauvegardés localement`))
  } catch (error) {
    console.error(red(`  ❌ Erreur sauvegarde locale: ${error.message}`))
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// Enrichir un actor avec GPT
async function enrichActorWithGPT(actor) {
  if (!openai) {
    console.log(yellow(`  ⚠️ OpenAI non disponible, utilisation des données de base`))
    return {
      ...actor,
      enrichedData: {
        useCases: [],
        problem: [],
        solution: [],
        keywords: []
      }
    }
  }

  try {
    const prompt = `Tu es un expert en scraping web, automatisation et marketing B2B. Analyse cet outil de scraping Apify et génère un enrichissement complet EN FRANÇAIS pour créer une page de vente convaincante.

Actor: ${actor.title}
Description: ${actor.description}
URL: ${actor.url}
Stats: ${actor.stats.users} utilisateurs, ${actor.stats.successRate}% de réussite

Génère un JSON avec (TOUT EN FRANÇAIS):
1. description: Description complète traduite en français, professionnelle et accrocheuse (string, 200-300 caractères)
2. shortDescription: Une description courte et accrocheuse en français (max 150 caractères, string)
3. category: Catégorie principale en français (string, ex: "Scraping & Automatisation", "Génération de leads", "Immobilier", etc.)
4. useCases: 3-5 cas d'usage concrets et spécifiques en français avec contexte business (tableau de strings, format: "Pour [persona] qui veut [objectif], cet outil permet de [action concrète]")
5. problem: 3-4 problèmes que cet outil résout en français, formulés comme des frustrations client (tableau de strings, format: "Vous perdez du temps à [action manuelle] alors que vous pourriez automatiser")
6. solution: 3-4 solutions apportées par l'outil en français, formulées comme des bénéfices (tableau de strings, format: "Extrayez [données] en [temps] au lieu de [alternative manuelle]")
7. targetAudience: À qui s'adresse cet outil ? (tableau de strings, ex: ["Agences immobilières", "Développeurs web", "Marketers B2B"])
8. valueProposition: Proposition de valeur unique en 1 phrase (string, max 200 caractères)
9. objections: 2-3 objections courantes que les clients pourraient avoir (tableau de strings, format: "Est-ce que ça fonctionne vraiment ?")
10. objectionsAnswers: Réponses aux objections (tableau de strings, même ordre que objections)
11. keywords: 8-12 mots-clés SEO pertinents en français (tableau de strings)
12. howToSteps: 4-5 étapes simples pour utiliser l'outil (tableau d'objets avec {name: string, text: string})
13. expectedResults: Résultats attendus après utilisation (string, 100-200 caractères)

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans code blocks.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en scraping web et automatisation. Tu génères toujours des JSON valides.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = response.choices[0].message.content.trim()
    // Nettoyer le contenu si c'est dans un code block
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const enrichedData = JSON.parse(jsonContent)

    return {
      ...actor,
      // Remplacer la description par la version française enrichie
      description: enrichedData.description || actor.description,
      enrichedData: {
        useCases: enrichedData.useCases || [],
        problem: enrichedData.problem || [],
        solution: enrichedData.solution || [],
        keywords: enrichedData.keywords || [],
        shortDescription: enrichedData.shortDescription || actor.description.substring(0, 150),
        category: enrichedData.category || 'Scraping & Automatisation',
        targetAudience: enrichedData.targetAudience || [],
        valueProposition: enrichedData.valueProposition || '',
        objections: enrichedData.objections || [],
        objectionsAnswers: enrichedData.objectionsAnswers || [],
        howToSteps: enrichedData.howToSteps || [],
        expectedResults: enrichedData.expectedResults || ''
      },
      lastEnriched: new Date().toISOString()
    }
  } catch (error) {
    console.error(red(`  ❌ Erreur enrichissement GPT pour ${actor.name}: ${error.message}`))
    return {
      ...actor,
      enrichedData: {
        useCases: [],
        problem: [],
        solution: [],
        keywords: [],
        shortDescription: actor.description.substring(0, 150),
        category: 'Scraping & Automatisation',
        targetAudience: [],
        valueProposition: '',
        objections: [],
        objectionsAnswers: [],
        howToSteps: [],
        expectedResults: ''
      },
      // Garder la description originale si GPT n'est pas disponible
      description: actor.description
    }
  }
}

// Traiter un actor
async function processActor(actor, existingActors) {
  const existing = existingActors.find(a => a.id === actor.id)

  // Si l'actor existe déjà et a été enrichi récemment, vérifier s'il faut le mettre à jour
  if (existing && existing.lastEnriched) {
    const lastEnriched = new Date(existing.lastEnriched)
    const daysSinceEnrichment = (new Date() - lastEnriched) / (1000 * 60 * 60 * 24)
    
    // Mettre à jour les stats même si déjà enrichi
    const updated = {
      ...existing,
      stats: actor.stats,
      url: actor.url,
      title: actor.title,
      description: actor.description
    }

    // Vérifier si les nouvelles données d'enrichissement sont présentes
    const hasNewEnrichmentData = updated.enrichedData?.targetAudience?.length > 0 && 
                                 updated.enrichedData?.valueProposition &&
                                 updated.enrichedData?.objections?.length > 0 &&
                                 updated.enrichedData?.howToSteps?.length > 0

    // Ré-enrichir si plus de 7 jours OU si les nouvelles données ne sont pas présentes
    if (daysSinceEnrichment > 7 || !hasNewEnrichmentData) {
      console.log(yellow(`  🔄 Ré-enrichissement de ${actor.name}${!hasNewEnrichmentData ? ' (nouvelles données manquantes)' : ` (${Math.floor(daysSinceEnrichment)} jours)`}`))
      return await enrichActorWithGPT(updated)
    }

    return updated
  }

  // Nouvel actor, enrichir
  console.log(blue(`  ✨ Nouvel actor détecté: ${actor.name}`))
  return await enrichActorWithGPT(actor)
}

// Fonction principale
async function main() {
  console.log(cyan('\n🚀 Démarrage de l\'enrichissement des actors Apify...\n'))

  // Charger les actors existants
  const existingActors = await loadActors()
  console.log(cyan(`📦 ${existingActors.length} actors déjà enregistrés\n`))

  // Récupérer les actors depuis Apify (pour l'instant, liste statique)
  // Dans le futur, on pourra utiliser l'API Apify ou le MCP
  const apifyActors = STATIC_ACTORS

  // Filtrer selon les arguments
  let actorsToProcess = apifyActors
  if (actorId) {
    actorsToProcess = apifyActors.filter(a => a.id === actorId)
    if (actorsToProcess.length === 0) {
      console.error(red(`❌ Actor ${actorId} non trouvé`))
      return
    }
  }

  console.log(cyan(`📋 ${actorsToProcess.length} actors à traiter\n`))

  // Traiter chaque actor
  const processedActors = []
  for (const actor of actorsToProcess) {
    try {
      const enriched = await processActor(actor, existingActors)
      processedActors.push(enriched)
      console.log(green(`  ✓ ${enriched.name} traité`))
    } catch (error) {
      console.error(red(`  ❌ Erreur traitement ${actor.name}: ${error.message}`))
    }
  }

  // Fusionner avec les actors existants (garder ceux qui ne sont pas dans la liste actuelle)
  const mergedActors = [
    ...processedActors,
    ...existingActors.filter(existing => 
      !actorsToProcess.some(newActor => newActor.id === existing.id)
    )
  ]

  // Sauvegarder
  await saveActors(mergedActors)

  console.log(green(`\n✅ Enrichissement terminé: ${processedActors.length} actors traités, ${mergedActors.length} actors au total\n`))
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error(red(`\n❌ Erreur fatale: ${error.message}\n`))
    process.exit(1)
  })
}

module.exports = { main }
