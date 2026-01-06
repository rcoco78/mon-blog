/**
 * Script d'automatisation pour synchroniser les Google Sheets avec la marketplace
 * 
 * Ce script :
 * 1. Scanne un dossier Google Drive spécifique pour trouver les Google Sheets
 * 2. Analyse chaque Sheet pour extraire les métadonnées (colonnes, nombre de lignes, etc.)
 * 3. Génère automatiquement :
 *    - L'entrée dans lib/tools.js
 *    - La page dédiée dans pages/marketplace/[slug].js
 * 
 * Usage:
 *   node scripts/sync-google-sheets-marketplace.js
 *   node scripts/sync-google-sheets-marketplace.js --dry-run  # Mode test sans modifications
 *   node scripts/sync-google-sheets-marketplace.js --folder-id=YOUR_FOLDER_ID  # Dossier spécifique
 */

const { google } = require('googleapis')
const fs = require('fs').promises
const path = require('path')
const readline = require('readline')

// Configuration
const CONFIG_PATH = path.join(__dirname, '..', 'scripts', 'marketplace-sheets-config.json')
const TOOLS_FILE = path.join(__dirname, '..', 'lib', 'tools.js')
const MARKETPLACE_PAGES_DIR = path.join(__dirname, '..', 'pages', 'marketplace')
const TEMPLATE_PAGE_PATH = path.join(__dirname, 'templates', 'marketplace-page-template.js')

// Parse arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const folderIdArg = args.find(arg => arg.startsWith('--folder-id='))
const folderId = folderIdArg ? folderIdArg.split('=')[1] : null

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Fonction pour obtenir les credentials Google
async function getAuth() {
  // Option 1: Service Account (recommandé pour production)
  // Option 2: OAuth2 (pour développement)
  
  const credentialsPath = path.join(__dirname, '..', 'credentials.json')
  const tokenPath = path.join(__dirname, '..', 'token.json')
  
  try {
    // Vérifier si on a un service account
    const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json')
    if (await fileExists(serviceAccountPath)) {
      log('✓ Utilisation du Service Account', 'green')
      const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'))
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/spreadsheets.readonly'
        ]
      })
      return await auth.getClient()
    }
    
    // Sinon, utiliser OAuth2
    if (!(await fileExists(credentialsPath))) {
      throw new Error('Fichier credentials.json non trouvé. Consultez la documentation pour configurer Google OAuth.')
    }
    
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'))
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    
    if (await fileExists(tokenPath)) {
      const token = JSON.parse(await fs.readFile(tokenPath, 'utf8'))
      oAuth2Client.setCredentials(token)
      return oAuth2Client
    }
    
    // Demander l'autorisation
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    })
    
    log('\n⚠️  Première utilisation : autorisation requise', 'yellow')
    log(`Ouvrez cette URL dans votre navigateur :\n${authUrl}\n`, 'cyan')
    
    const code = await askQuestion('Entrez le code d\'autorisation : ')
    const { tokens } = await oAuth2Client.getToken(code)
    oAuth2Client.setCredentials(tokens)
    
    await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2))
    log('✓ Token sauvegardé', 'green')
    
    return oAuth2Client
  } catch (error) {
    log(`✗ Erreur d'authentification: ${error.message}`, 'red')
    throw error
  }
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close()
      resolve(answer)
    })
  })
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// Fonction pour scanner un dossier Google Drive
async function scanDriveFolder(drive, folderId) {
  log(`\n📂 Scan du dossier Google Drive: ${folderId || 'root'}`, 'blue')
  
  const query = folderId 
    ? `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
    : `mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  
  try {
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, createdTime, modifiedTime, webViewLink, owners)',
      orderBy: 'modifiedTime desc'
    })
    
    const sheets = response.data.files || []
    log(`✓ ${sheets.length} Google Sheets trouvés`, 'green')
    
    return sheets
  } catch (error) {
    log(`✗ Erreur lors du scan: ${error.message}`, 'red')
    throw error
  }
}

// Fonction pour analyser un Google Sheet
async function analyzeSheet(sheets, sheetId, sheetName) {
  log(`\n📊 Analyse de: ${sheetName}`, 'cyan')
  
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: false
    })
    
    const spreadsheet = response.data
    const firstSheet = spreadsheet.sheets?.[0]
    const properties = firstSheet?.properties || {}
    
    // Obtenir les en-têtes de colonnes
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: '1:1'
    })
    
    const headers = headersResponse.data.values?.[0] || []
    
    // Compter les lignes de données (approximatif)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:A'
    })
    
    const rowCount = (dataResponse.data.values?.length || 1) - 1 // -1 pour l'en-tête
    
    return {
      sheetId,
      name: sheetName,
      url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      headers,
      rowCount,
      sheetCount: spreadsheet.sheets?.length || 0,
      createdTime: spreadsheet.properties?.createdTime,
      modifiedTime: spreadsheet.properties?.modifiedTime
    }
  } catch (error) {
    log(`✗ Erreur lors de l'analyse: ${error.message}`, 'red')
    return null
  }
}

// Fonction pour générer un slug à partir du nom
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

// Fonction pour charger la configuration
async function loadConfig() {
  if (await fileExists(CONFIG_PATH)) {
    return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'))
  }
  return {
    folderId: null,
    defaultCategory: 'Finance',
    defaultPrice: 99,
    defaultIsPaid: true,
    mappings: {} // { sheetId: { category, price, isPaid, description, ... } }
  }
}

// Fonction pour générer l'entrée dans tools.js
function generateToolEntry(sheetData, config, mapping) {
  const slug = generateSlug(sheetData.name)
  const category = mapping?.category || config.defaultCategory
  const price = mapping?.price || config.defaultPrice
  const isPaid = mapping?.isPaid !== undefined ? mapping.isPaid : config.defaultIsPaid
  
  // Générer une description si non fournie
  const description = mapping?.description || 
    `Base de données complète avec ${sheetData.rowCount.toLocaleString()} entrées. ${sheetData.headers.length} champs par entrée : ${sheetData.headers.slice(0, 5).join(', ')}${sheetData.headers.length > 5 ? '...' : ''}. Idéal pour la prospection et l'analyse de marché.`
  
  return {
    name: `Base de données - ${sheetData.name}`,
    description,
    category,
    type: 'database',
    iconSvg: 'search',
    link: `/marketplace/${slug}`,
    isPaid,
    price: isPaid ? price : undefined,
    isNew: true,
    date: new Date().toISOString().split('T')[0]
  }
}

// Fonction pour mettre à jour tools.js
async function updateToolsFile(newEntry) {
  const content = await fs.readFile(TOOLS_FILE, 'utf8')
  
  // Extraire le tableau tools - méthode plus robuste
  const toolsMatch = content.match(/export const tools = \[([\s\S]*?)\]\s*\n/)
  if (!toolsMatch) {
    throw new Error('Format de tools.js invalide - impossible de trouver "export const tools = [...]"')
  }
  
  // Importer dynamiquement le fichier pour obtenir les outils existants
  // Note: En Node.js, on peut utiliser require() pour charger un fichier JS
  delete require.cache[require.resolve(TOOLS_FILE)]
  const toolsModule = require(TOOLS_FILE)
  const existingTools = Array.isArray(toolsModule.tools) ? [...toolsModule.tools] : []
  
  // Vérifier si l'entrée existe déjà (par link ou par name)
  const existingIndex = existingTools.findIndex(t => 
    t.link === newEntry.link || t.name === newEntry.name
  )
  
  if (existingIndex >= 0) {
    // Mettre à jour l'entrée existante
    existingTools[existingIndex] = newEntry
    log(`✓ Entrée mise à jour dans tools.js: ${newEntry.name}`, 'green')
  } else {
    // Ajouter la nouvelle entrée au début
    existingTools.unshift(newEntry)
    log(`✓ Nouvelle entrée ajoutée dans tools.js: ${newEntry.name}`, 'green')
  }
  
  // Reconstruire le fichier avec formatage propre
  const toolsArray = existingTools.map(tool => {
    const props = Object.entries(tool)
      .filter(([key, value]) => value !== undefined) // Ignorer les valeurs undefined
      .map(([key, value]) => {
        if (typeof value === 'string') {
          // Échapper les apostrophes et guillemets
          const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
          return `    ${key}: '${escaped}'`
        } else if (typeof value === 'number') {
          return `    ${key}: ${value}`
        } else if (typeof value === 'boolean') {
          return `    ${key}: ${value}`
        } else {
          return `    ${key}: ${JSON.stringify(value)}`
        }
      }).join(',\n')
    return `  {\n${props}\n  }`
  }).join(',\n')
  
  const newContent = `// Liste des outils et bases de données disponibles
export const tools = [
${toolsArray}
]

// Fonction pour obtenir les outils les plus récents (triés par date, du plus récent au plus ancien)
export function getRecentTools(count = 3) {
  return tools
    .sort((a, b) => {
      // Trier par date : du plus récent au plus ancien
      const dateA = a.date ? new Date(a.date) : new Date(0) // Si pas de date, mettre en fin
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA // Ordre décroissant (plus récent en premier)
    })
    .slice(0, count)
}

`
  
  if (!isDryRun) {
    await fs.writeFile(TOOLS_FILE, newContent, 'utf8')
  } else {
    log('\n[DRY RUN] Contenu qui serait écrit dans tools.js:', 'yellow')
    console.log(newContent.substring(0, 1000) + (newContent.length > 1000 ? '...\n' : '\n'))
  }
}

// Fonction pour générer la page marketplace
async function generateMarketplacePage(sheetData, toolEntry, mapping) {
  const slug = generateSlug(sheetData.name)
  const pagePath = path.join(MARKETPLACE_PAGES_DIR, `${slug}.js`)
  
  // Vérifier si le template existe
  if (!(await fileExists(TEMPLATE_PAGE_PATH))) {
    log(`⚠️  Template non trouvé: ${TEMPLATE_PAGE_PATH}`, 'yellow')
    log('Création d\'un template basique...', 'yellow')
    await createBasicTemplate()
  }
  
  // Charger le template
  let template = await fs.readFile(TEMPLATE_PAGE_PATH, 'utf8')
  
  // Remplacer les placeholders
  const replacements = {
    '{{SLUG}}': slug,
    '{{NAME}}': toolEntry.name,
    '{{DESCRIPTION}}': toolEntry.description,
    '{{CATEGORY}}': toolEntry.category,
    '{{PRICE}}': toolEntry.price || 0,
    '{{PRICE_HT}}': toolEntry.price ? Math.round((toolEntry.price / 1.2) * 100) / 100 : 0,
    '{{IS_PAID}}': toolEntry.isPaid,
    '{{SHEET_ID}}': sheetData.sheetId,
    '{{SHEET_URL}}': sheetData.url,
    '{{ROW_COUNT}}': sheetData.rowCount.toLocaleString(),
    '{{HEADERS}}': JSON.stringify(sheetData.headers),
    '{{LAST_UPDATE}}': new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    '{{DATE}}': new Date().toISOString().split('T')[0]
  }
  
  Object.entries(replacements).forEach(([placeholder, value]) => {
    template = template.replace(new RegExp(placeholder, 'g'), value)
  })
  
  if (!isDryRun) {
    await fs.writeFile(pagePath, template, 'utf8')
    log(`✓ Page générée: ${pagePath}`, 'green')
  } else {
    log(`\n[DRY RUN] Page qui serait créée: ${pagePath}`, 'yellow')
    console.log(template.substring(0, 500) + '...\n')
  }
}

// Fonction pour créer un template basique si absent
async function createBasicTemplate() {
  const templateDir = path.dirname(TEMPLATE_PAGE_PATH)
  await fs.mkdir(templateDir, { recursive: true })
  
  // Template minimal basé sur capeb.js
  const basicTemplate = `// Template généré automatiquement
// Ce fichier sera remplacé par le script de génération
// Pour personnaliser, modifiez scripts/templates/marketplace-page-template.js

import { useState, useEffect } from 'react'
// ... (template complet à générer)
`
  
  await fs.writeFile(TEMPLATE_PAGE_PATH, basicTemplate, 'utf8')
  log(`✓ Template basique créé: ${TEMPLATE_PAGE_PATH}`, 'green')
}

// Fonction principale
async function main() {
  log('\n🚀 Synchronisation Google Sheets → Marketplace\n', 'blue')
  
  if (isDryRun) {
    log('⚠️  MODE DRY RUN - Aucune modification ne sera effectuée\n', 'yellow')
  }
  
  try {
    // Charger la configuration
    const config = await loadConfig()
    const targetFolderId = folderId || config.folderId
    
    if (!targetFolderId) {
      log('⚠️  Aucun dossier spécifié. Utilisation du dossier racine.', 'yellow')
      log('   Utilisez --folder-id=YOUR_FOLDER_ID ou configurez dans marketplace-sheets-config.json\n', 'yellow')
    }
    
    // Authentification
    const auth = await getAuth()
    const drive = google.drive({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })
    
    // Scanner le dossier
    const foundSheets = await scanDriveFolder(drive, targetFolderId)
    
    if (foundSheets.length === 0) {
      log('\n✓ Aucun Google Sheet trouvé. Rien à synchroniser.', 'green')
      return
    }
    
    // Analyser chaque sheet
    const analyzedSheets = []
    for (const sheet of foundSheets) {
      const analysis = await analyzeSheet(sheets, sheet.id, sheet.name)
      if (analysis) {
        analyzedSheets.push(analysis)
      }
    }
    
    log(`\n✓ ${analyzedSheets.length} sheets analysés avec succès`, 'green')
    
    // Générer les entrées et pages
    for (const sheetData of analyzedSheets) {
      const mapping = config.mappings[sheetData.sheetId] || {}
      const toolEntry = generateToolEntry(sheetData, config, mapping)
      
      log(`\n📝 Génération pour: ${sheetData.name}`, 'cyan')
      log(`   Slug: ${generateSlug(sheetData.name)}`, 'cyan')
      log(`   Lignes: ${sheetData.rowCount.toLocaleString()}`, 'cyan')
      log(`   Colonnes: ${sheetData.headers.length}`, 'cyan')
      
      await updateToolsFile(toolEntry)
      await generateMarketplacePage(sheetData, toolEntry, mapping)
    }
    
    log('\n✅ Synchronisation terminée avec succès !', 'green')
    
  } catch (error) {
    log(`\n✗ Erreur: ${error.message}`, 'red')
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Exécuter le script
if (require.main === module) {
  main()
}

module.exports = { main, scanDriveFolder, analyzeSheet, generateSlug }

