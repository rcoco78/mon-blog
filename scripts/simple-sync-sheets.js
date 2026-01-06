/**
 * Version SIMPLIFIÉE pour synchroniser Google Sheets → Marketplace
 * 
 * Usage ultra-simple:
 *   1. node scripts/simple-sync-sheets.js
 *   2. Le script liste vos Google Sheets
 *   3. Vous choisissez lesquels ajouter
 *   4. C'est tout !
 */

const { google } = require('googleapis')
const fs = require('fs').promises
const path = require('path')
const readline = require('readline')

const TOOLS_FILE = path.join(__dirname, '..', 'lib', 'tools.js')

// Couleurs
const green = (text) => `\x1b[32m${text}\x1b[0m`
const yellow = (text) => `\x1b[33m${text}\x1b[0m`
const blue = (text) => `\x1b[36m${text}\x1b[0m`
const red = (text) => `\x1b[31m${text}\x1b[0m`

// Authentification simple
async function getAuth() {
  const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json')
  
  if (await fileExists(serviceAccountPath)) {
    const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'))
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets.readonly']
    })
    return await auth.getClient()
  }
  
  throw new Error('❌ Fichier service-account-key.json non trouvé.\n   Créez un Service Account dans Google Cloud Console et placez la clé à la racine du projet.')
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer) }))
}

// Lister tous les Google Sheets
async function listAllSheets(drive) {
  console.log(blue('\n📊 Recherche de vos Google Sheets...\n'))
  
  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id, name, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: 50
  })
  
  return response.data.files || []
}

// Analyser un sheet (simple)
async function analyzeSheet(sheets, sheetId) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: '1:1'
    })
    const headers = response.data.values?.[0] || []
    
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:A'
    })
    const rowCount = (dataResponse.data.values?.length || 1) - 1
    
    return { headers, rowCount }
  } catch (error) {
    return { headers: [], rowCount: 0 }
  }
}

// Générer un slug
function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

// Vérifier si un outil existe déjà (par link ou name)
function toolExists(content, link, name) {
  // Vérifier si le link existe
  if (content.includes(`link: '${link}'`) || content.includes(`link: "${link}"`)) {
    return true
  }
  // Vérifier si le name existe
  if (content.includes(`name: '${name}'`) || content.includes(`name: "${name}"`)) {
    return true
  }
  return false
}

// Ajouter à tools.js (simple)
async function addToTools(sheetName, sheetId, rowCount, headers) {
  const slug = slugify(sheetName)
  const newEntry = {
    name: `Base de données - ${sheetName}`,
    description: `Base de données avec ${rowCount.toLocaleString()} entrées. ${headers.length} champs : ${headers.slice(0, 3).join(', ')}${headers.length > 3 ? '...' : ''}.`,
    category: 'Finance', // Par défaut, vous pourrez changer après
    type: 'database',
    iconSvg: 'search',
    link: `/marketplace/${slug}`,
    isPaid: true,
    price: 99,
    isNew: true,
    date: new Date().toISOString().split('T')[0]
  }
  
  // Lire tools.js
  const content = await fs.readFile(TOOLS_FILE, 'utf8')
  
  // Vérifier si existe déjà
  if (toolExists(content, newEntry.link, newEntry.name)) {
    console.log(yellow(`⚠️  ${sheetName} existe déjà, ignoré`))
    return false
  }
  
  // Créer la nouvelle entrée formatée
  const newEntryFormatted = `  {
    name: '${newEntry.name.replace(/'/g, "\\'")}',
    description: '${newEntry.description.replace(/'/g, "\\'")}',
    category: '${newEntry.category}',
    type: '${newEntry.type}',
    iconSvg: '${newEntry.iconSvg}',
    link: '${newEntry.link}',
    isPaid: ${newEntry.isPaid},
    price: ${newEntry.price}, // Prix achat unique TTC
    isNew: ${newEntry.isNew},
    date: '${newEntry.date}'
  },`
  
  // Trouver où insérer (après "export const tools = [")
  const insertMatch = content.match(/export const tools = \[\s*\n/)
  if (!insertMatch) {
    throw new Error('Format de tools.js invalide - impossible de trouver "export const tools = ["')
  }
  
  const insertIndex = insertMatch.index + insertMatch[0].length
  const newContent = content.slice(0, insertIndex) + newEntryFormatted + '\n' + content.slice(insertIndex)
  
  await fs.writeFile(TOOLS_FILE, newContent, 'utf8')
  console.log(green(`✅ ${sheetName} ajouté à tools.js`))
  return true
}

// Main
async function main() {
  console.log(blue('\n🚀 Synchronisation simple Google Sheets → Marketplace\n'))
  
  try {
    // Auth
    const auth = await getAuth()
    const drive = google.drive({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })
    
    // Lister les sheets
    const allSheets = await listAllSheets(drive)
    
    if (allSheets.length === 0) {
      console.log(yellow('❌ Aucun Google Sheet trouvé'))
      return
    }
    
    console.log(blue(`\n📋 ${allSheets.length} Google Sheets trouvés :\n`))
    
    // Afficher la liste
    allSheets.forEach((sheet, index) => {
      console.log(`${index + 1}. ${sheet.name}`)
      console.log(`   ID: ${sheet.id}`)
      console.log(`   Lien: ${sheet.webViewLink}\n`)
    })
    
    // Demander lesquels ajouter
    const answer = await ask(yellow('\n❓ Quels sheets voulez-vous ajouter ? (ex: 1,3,5 ou "tous") : '))
    
    let selectedIndices = []
    if (answer.toLowerCase() === 'tous' || answer.toLowerCase() === 'all') {
      selectedIndices = allSheets.map((_, i) => i)
    } else {
      selectedIndices = answer.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < allSheets.length)
    }
    
    if (selectedIndices.length === 0) {
      console.log(yellow('❌ Aucun sheet sélectionné'))
      return
    }
    
    console.log(blue(`\n📊 Analyse de ${selectedIndices.length} sheet(s)...\n`))
    
    // Traiter chaque sheet
    for (const index of selectedIndices) {
      const sheet = allSheets[index]
      console.log(blue(`\n📄 ${sheet.name}...`))
      
      const analysis = await analyzeSheet(sheets, sheet.id)
      console.log(`   ${analysis.rowCount.toLocaleString()} lignes, ${analysis.headers.length} colonnes`)
      
      const added = await addToTools(sheet.name, sheet.id, analysis.rowCount, analysis.headers)
      
      if (added) {
        console.log(yellow(`   ⚠️  N'oubliez pas de créer la page: pages/marketplace/${slugify(sheet.name)}.js`))
        console.log(yellow(`   💡 Copiez pages/marketplace/capeb.js comme base`))
      }
    }
    
    console.log(green('\n✅ Terminé !\n'))
    console.log(yellow('📝 Prochaines étapes:'))
    console.log('   1. Vérifiez lib/tools.js')
    console.log('   2. Créez les pages marketplace (copiez capeb.js comme base)')
    console.log('   3. Personnalisez les descriptions et prix si besoin\n')
    
  } catch (error) {
    console.log(red(`\n❌ Erreur: ${error.message}\n`))
    if (error.stack) console.log(error.stack)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }

