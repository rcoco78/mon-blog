#!/usr/bin/env node

/**
 * Script pour générer automatiquement les données personnalisées
 * pour tous les cas d'usage avec GPT-4o mini
 * 
 * Usage: node scripts/generate-personalized-case-studies.js [--resume] [--limit=N] [--workers=N]
 * 
 * Options:
 *   --resume    : Reprendre là où on s'est arrêté (skip les cas déjà traités)
 *   --limit=N   : Limiter à N cas d'usage (pour tester)
 *   --workers=N : Nombre de workers en parallèle (défaut: 30)
 */

const fs = require('fs')
const path = require('path')

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const CASE_STUDIES_FILE = path.join(__dirname, '../lib/case-studies.js')
const PERSONALIZED_FILE = path.join(__dirname, '../lib/case-studies-personalized1.js')
const PROGRESS_FILE = path.join(__dirname, '../.personalized-progress.json')

// Rate limiting : 1 requête par seconde pour éviter de dépasser les limites
const DELAY_BETWEEN_REQUESTS = 1000 // ms

// Vérifier la clé API
if (!OPENAI_API_KEY) {
  console.error('❌ Erreur: OPENAI_API_KEY n\'est pas définie dans les variables d\'environnement')
  console.error('   Ajoutez-la dans votre fichier .env.local ou exportez-la:')
  console.error('   export OPENAI_API_KEY=sk-...')
  process.exit(1)
}

// Charger les cas d'usage depuis case-studies.js
function loadCaseStudies() {
  try {
    const content = fs.readFileSync(CASE_STUDIES_FILE, 'utf-8')
    
    // Créer un fichier temporaire avec un export CommonJS
    // Utiliser un nom de variable différent pour éviter les conflits
    const tempFile = path.join(__dirname, '../lib/.case-studies-temp.js')
    
    // Extraire uniquement le tableau caseStudies (tout ce qui est entre export const caseStudies = [ et le premier export function)
    const caseStudiesMatch = content.match(/export const caseStudies = \[([\s\S]*?)(?=\n\s*export function|\n\s*$)/)
    if (!caseStudiesMatch) {
      throw new Error('Impossible de trouver le tableau caseStudies')
    }
    
    // Corriger les erreurs de syntaxe dans le contenu extrait
    let fixedContent = caseStudiesMatch[1]
    
    // 1. Corriger les triple apostrophes ('''') par des apostrophes échappées (\')
    // Le fichier source utilise ''' pour échapper une apostrophe dans une chaîne avec apostrophes simples
    fixedContent = fixedContent.replace(/'''/g, "\\'")
    
    // 2. Corriger les doubles fermetures de tableau (],    ],) par une seule (],)
    // Le pattern est: ],    ], (deux ], consécutifs séparés par espaces et virgule)
    // On cherche: ], puis espaces optionnels, puis virgule, puis espaces optionnels, puis ],
    // Et on remplace tout par juste ],
    // Gère les cas: ],    ], ou ],], ou ],  ],
    fixedContent = fixedContent.replace(/\]\s*,\s*\]\s*,/g, '],')
    
    // Créer un fichier temporaire avec seulement le tableau
    const tempContent = `const caseStudiesData = [${fixedContent}]\n\nmodule.exports = { caseStudies: caseStudiesData }`
    
    fs.writeFileSync(tempFile, tempContent)
    
    // Charger le module
    const tempPath = path.resolve(tempFile)
    delete require.cache[tempPath]
    const moduleData = require(tempPath)
    const result = moduleData.caseStudies || []
    
    // Nettoyer le fichier temporaire
    try {
      fs.unlinkSync(tempFile)
    } catch (e) {
      // Ignorer si le fichier n'existe pas
    }
    
    return result
  } catch (error) {
    console.error('❌ Erreur lors du chargement des cas d\'usage:', error.message)
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'))
    }
    process.exit(1)
  }
}

// Charger les données personnalisées existantes
function loadPersonalizedData() {
  if (!fs.existsSync(PERSONALIZED_FILE)) {
    return {}
  }
  try {
    const content = fs.readFileSync(PERSONALIZED_FILE, 'utf-8')
    const match = content.match(/export const personalizedCaseStudies = \{([\s\S]*)\}/)
    if (!match) {
      return {}
    }
    // Extraire les slugs déjà traités
    const slugs = []
    const slugRegex = /['"]([^'"]+)['"]:\s*\{/g
    let matchSlug
    while ((matchSlug = slugRegex.exec(match[1])) !== null) {
      slugs.push(matchSlug[1])
    }
    return { slugs, content }
  } catch (error) {
    console.warn('⚠️  Erreur lors du chargement des données personnalisées:', error.message)
    return {}
  }
}

// Charger le progrès
function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return { lastProcessed: null, processed: [] }
  }
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
  } catch (error) {
    return { lastProcessed: null, processed: [] }
  }
}

// Sauvegarder le progrès
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// Appeler l'API OpenAI
async function generatePersonalizedData(caseStudy) {
  const prompt = `Tu es un expert en rédaction de contenu SEO et marketing B2B. 

Génère des données personnalisées pour ce cas d'usage de scraping :

**Informations du cas d'usage :**
- Titre: ${caseStudy.title}
- Secteur: ${caseStudy.sector}
- Description: ${caseStudy.description}
- Données extractibles: ${caseStudy.dataExtracted.join(', ')}
- Bénéfices: ${caseStudy.benefits.join(', ')}
- Sources: ${caseStudy.examples.join(', ')}

**Format de réponse attendu (JSON strict) :**
{
  "whyUseCase": {
    "problemsSolved": "Description détaillée des problèmes concrets que ce cas d'usage résout pour le secteur ${caseStudy.sector.toLowerCase()}. Maximum 200 mots.",
    "concreteExamples": "Exemples concrets d'utilisation des données extraites. Maximum 150 mots.",
    "businessImpact": "Impact business et ROI avec chiffres concrets si possible. Maximum 150 mots."
  },
  "benefits": {
    "intro": "Introduction personnalisée pour la section 'Bénéfices pour votre business'. Maximum 100 mots."
  },
  "dataExample": {
    "columns": ["Colonne 1", "Colonne 2", ...],
    "sampleRows": [
      ["Valeur 1", "Valeur 2", ...],
      ["Valeur 1", "Valeur 2", ...],
      ["Valeur 1", "Valeur 2", ...]
    ]
  },
  "hasContactData": true/false
}

**Instructions importantes :**
1. Les colonnes de dataExample doivent correspondre aux données extractibles listées
2. Les sampleRows doivent contenir 3 lignes d'exemple réalistes (anonymisées)
3. hasContactData doit être true si les données contiennent des emails, téléphones, noms, contacts, leads, prospects
4. Le contenu doit être en français, professionnel et orienté B2B
5. Utilise des chiffres concrets (heures gagnées, pourcentages, volumes) quand c'est pertinent
6. Sois spécifique au secteur ${caseStudy.sector}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en rédaction de contenu SEO et marketing B2B. Tu réponds toujours en JSON valide, sans texte supplémentaire.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API OpenAI error: ${error.error?.message || JSON.stringify(error)}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    // Extraire le JSON (peut être entouré de markdown code blocks)
    let jsonContent = content
    if (content.startsWith('```')) {
      jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    }
    
    return JSON.parse(jsonContent)
  } catch (error) {
    console.error(`❌ Erreur pour ${caseStudy.slug}:`, error.message)
    throw error
  }
}

// Fonction pour échapper les chaînes JavaScript de manière sûre
function escapeJSString(str) {
  if (typeof str !== 'string') {
    str = String(str)
  }
  return str
    .replace(/\\/g, '\\\\')  // Échapper les backslashes d'abord
    .replace(/'/g, "\\'")    // Échapper les apostrophes
    .replace(/\n/g, '\\n')   // Échapper les retours à la ligne
    .replace(/\r/g, '\\r')   // Échapper les retours chariot
    .replace(/\t/g, '\\t')   // Échapper les tabulations
}

// Formater les données pour le fichier JS
function formatPersonalizedData(slug, data) {
  const indent = '    '
  let output = `  '${slug}': {\n`
  
  // whyUseCase
  output += `${indent}whyUseCase: {\n`
  output += `${indent}  problemsSolved: '${escapeJSString(data.whyUseCase.problemsSolved)}',\n`
  output += `${indent}  concreteExamples: '${escapeJSString(data.whyUseCase.concreteExamples)}',\n`
  output += `${indent}  businessImpact: '${escapeJSString(data.whyUseCase.businessImpact)}',\n`
  output += `${indent}},\n`
  
  // benefits
  output += `${indent}benefits: {\n`
  output += `${indent}  intro: '${escapeJSString(data.benefits.intro)}',\n`
  output += `${indent}},\n`
  
  // dataExample
  output += `${indent}dataExample: {\n`
  output += `${indent}  columns: [${data.dataExample.columns.map(c => `'${escapeJSString(c)}'`).join(', ')}],\n`
  output += `${indent}  sampleRows: [\n`
  data.dataExample.sampleRows.forEach(row => {
    const escapedRow = row.map(cell => `'${escapeJSString(String(cell))}'`).join(', ')
    output += `${indent}    [${escapedRow}],\n`
  })
  output += `${indent}  ],\n`
  output += `${indent}},\n`
  
  // hasContactData
  output += `${indent}hasContactData: ${data.hasContactData},\n`
  
  // videoUrl et videoThumbnail
  output += `${indent}videoUrl: null,\n`
  output += `${indent}videoThumbnail: null\n`
  
  output += `  }`
  return output
}

// Queue pour les écritures de fichier (évite les conflits en parallèle)
const writeQueue = []
let isWriting = false

// Ajouter un cas d'usage au fichier (thread-safe)
async function appendToFile(slug, data) {
  const formatted = formatPersonalizedData(slug, data)
  
  // Ajouter à la queue
  return new Promise((resolve, reject) => {
    writeQueue.push({ slug, formatted, resolve, reject })
    processWriteQueue()
  })
}

// Traiter la queue d'écriture de manière séquentielle
async function processWriteQueue() {
  if (isWriting || writeQueue.length === 0) {
    return
  }
  
  isWriting = true
  
  while (writeQueue.length > 0) {
    const { slug, formatted, resolve, reject } = writeQueue.shift()
    
    try {
      if (!fs.existsSync(PERSONALIZED_FILE)) {
        // Créer le fichier initial
        const header = `// Données personnalisées pour les cas d'usage
// Ce fichier contient les données enrichies pour les sections personnalisées
// Généré automatiquement via script avec GPT-4o mini

export const personalizedCaseStudies = {
${formatted}
}
`
        fs.writeFileSync(PERSONALIZED_FILE, header)
      } else {
        // Ajouter avant la dernière accolade de l'objet personalizedCaseStudies
        const content = fs.readFileSync(PERSONALIZED_FILE, 'utf-8')
        
        // Trouver la position de l'accolade fermante de l'objet personalizedCaseStudies
        // On cherche: export const personalizedCaseStudies = { ... } ... (reste)
        const objectStart = content.indexOf('export const personalizedCaseStudies = {')
        if (objectStart === -1) {
          throw new Error('Impossible de trouver personalizedCaseStudies dans le fichier')
        }
        
        // Trouver l'accolade fermante correspondante
        let braceCount = 0
        let objectEnd = objectStart
        let foundStart = false
        
        for (let i = objectStart; i < content.length; i++) {
          if (content[i] === '{') {
            braceCount++
            foundStart = true
          } else if (content[i] === '}') {
            braceCount--
            if (foundStart && braceCount === 0) {
              objectEnd = i
              break
            }
          }
        }
        
        // Extraire les parties
        const beforeObject = content.substring(0, objectStart + 'export const personalizedCaseStudies = {'.length)
        const insideObject = content.substring(objectStart + 'export const personalizedCaseStudies = {'.length, objectEnd).trim()
        const afterObject = content.substring(objectEnd + 1) // +1 pour sauter le }
        
        // Construire le nouveau contenu
        let newInsideObject
        if (insideObject) {
          newInsideObject = `${insideObject},\n${formatted}`
        } else {
          newInsideObject = formatted
        }
        
        const newContent = `${beforeObject}\n${newInsideObject}\n}${afterObject}`
        fs.writeFileSync(PERSONALIZED_FILE, newContent)
      }
      resolve()
    } catch (error) {
      reject(error)
    }
  }
  
  isWriting = false
}

// Fonction de délai
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  const resume = args.includes('--resume')
  const limitArg = args.find(arg => arg.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null
  const workersArg = args.find(arg => arg.startsWith('--workers='))
  const POOL_SIZE = workersArg ? parseInt(workersArg.split('=')[1]) : 30

  console.log('🚀 Démarrage de la génération des données personnalisées...\n')

  // Charger les données
  console.log('📖 Chargement des cas d\'usage...')
  const caseStudies = loadCaseStudies()
  console.log(`✅ ${caseStudies.length} cas d\'usage chargés\n`)

  // Charger le progrès
  const progress = loadProgress()
  const personalized = loadPersonalizedData()
  const alreadyProcessed = new Set([
    ...progress.processed,
    ...(personalized.slugs || [])
  ])

  // Filtrer les cas déjà traités si --resume
  let toProcess = caseStudies
  if (resume) {
    toProcess = caseStudies.filter(cs => !alreadyProcessed.has(cs.slug))
    console.log(`📊 ${alreadyProcessed.size} cas déjà traités, ${toProcess.length} restants\n`)
  }

  // Limiter si --limit
  if (limit) {
    toProcess = toProcess.slice(0, limit)
    console.log(`🔢 Limitation à ${limit} cas d\'usage\n`)
  }

  if (toProcess.length === 0) {
    console.log('✅ Tous les cas d\'usage sont déjà traités !')
    return
  }

  console.log(`🎯 Traitement de ${toProcess.length} cas d\'usage en parallèle continu (pool de ${POOL_SIZE} workers)...\n`)

  let successCount = 0
  let errorCount = 0
  let processedCount = 0

  // Fonction worker qui traite un cas d'usage
  async function processCaseStudy(caseStudy, index) {
    try {
      console.log(`  [${index + 1}/${toProcess.length}] ${caseStudy.slug}...`)
      const data = await generatePersonalizedData(caseStudy)
      await appendToFile(caseStudy.slug, data)
      
      progress.processed.push(caseStudy.slug)
      progress.lastProcessed = caseStudy.slug
      
      successCount++
      processedCount++
      const progressPercent = ((processedCount / toProcess.length) * 100).toFixed(1)
      console.log(`  ✅ [${index + 1}/${toProcess.length}] ${caseStudy.slug} - Généré avec succès (${progressPercent}%)`)
      
      // Sauvegarder le progrès périodiquement (tous les 5 succès)
      if (successCount % 5 === 0) {
        saveProgress(progress)
      }
      
      return { success: true, slug: caseStudy.slug }
    } catch (error) {
      errorCount++
      processedCount++
      const progressPercent = ((processedCount / toProcess.length) * 100).toFixed(1)
      console.error(`  ❌ [${index + 1}/${toProcess.length}] ${caseStudy.slug} - Erreur: ${error.message} (${progressPercent}%)`)
      
      // Sauvegarder le progrès même en cas d'erreur
      saveProgress(progress)
      
      return { success: false, slug: caseStudy.slug, error: error.message }
    }
  }

  // Pool de workers continu avec queue
  const queue = [...toProcess]
  const workers = []
  let globalIndex = 0

  // Créer le pool de workers
  for (let i = 0; i < Math.min(POOL_SIZE, queue.length); i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const caseStudy = queue.shift()
          if (!caseStudy) break
          
          const index = globalIndex++
          await processCaseStudy(caseStudy, index)
          
          // Petit délai pour éviter de surcharger l'API
          if (queue.length > 0) {
            await delay(DELAY_BETWEEN_REQUESTS / POOL_SIZE)
          }
        }
      })()
    )
  }

  // Attendre que tous les workers terminent
  await Promise.all(workers)
  
  // Sauvegarder le progrès final
  saveProgress(progress)

  console.log(`\n✅ Terminé !`)
  console.log(`   Succès: ${successCount}`)
  console.log(`   Erreurs: ${errorCount}`)
  console.log(`   Fichier: ${PERSONALIZED_FILE}`)
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

