/**
 * API Route pour synchroniser un Google Sheet spécifique avec la marketplace
 * 
 * Peut être appelée via :
 * - Webhook Google Drive (quand un fichier est ajouté/modifié)
 * - Appel manuel avec sheetId
 * 
 * Usage:
 *   POST /api/marketplace/sync-sheet
 *   Body: { sheetId: 'abc123...', folderId: 'xyz789...' (optionnel) }
 */

const { google } = require('googleapis')
const fs = require('fs').promises
const path = require('path')

// Import des fonctions du script principal
const { scanDriveFolder, analyzeSheet, generateSlug } = require('../../../scripts/sync-google-sheets-marketplace')

const TOOLS_FILE = path.join(process.cwd(), 'lib', 'tools.js')
const MARKETPLACE_PAGES_DIR = path.join(process.cwd(), 'pages', 'marketplace')

// Fonction pour obtenir l'authentification (similaire au script principal)
async function getAuth() {
  const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json')
  const credentialsPath = path.join(process.cwd(), 'credentials.json')
  
  try {
    if (await fileExists(serviceAccountPath)) {
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
    
    // Pour OAuth2, on aurait besoin du token, mais en production on utilise plutôt Service Account
    throw new Error('Service Account requis pour les webhooks')
  } catch (error) {
    throw new Error(`Erreur d'authentification: ${error.message}`)
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

export default async function handler(req, res) {
  // Vérifier la méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Vérifier l'authentification (optionnel, selon votre sécurité)
  const authHeader = req.headers.authorization
  const expectedToken = process.env.MARKETPLACE_SYNC_SECRET
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { sheetId, folderId } = req.body

    if (!sheetId) {
      return res.status(400).json({ error: 'sheetId requis' })
    }

    // Authentification
    const auth = await getAuth()
    const drive = google.drive({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })

    // Obtenir les infos du fichier
    const fileResponse = await drive.files.get({
      fileId: sheetId,
      fields: 'id, name, createdTime, modifiedTime, webViewLink'
    })

    const sheetName = fileResponse.data.name

    // Analyser le sheet
    const sheetData = await analyzeSheet(sheets, sheetId, sheetName)

    if (!sheetData) {
      return res.status(500).json({ error: 'Erreur lors de l\'analyse du sheet' })
    }

    // Charger la configuration
    const configPath = path.join(process.cwd(), 'scripts', 'marketplace-sheets-config.json')
    let config = {}
    if (await fileExists(configPath)) {
      config = JSON.parse(await fs.readFile(configPath, 'utf8'))
    }

    const mapping = config.mappings?.[sheetId] || {}
    const category = mapping.category || config.defaultCategory || 'Finance'
    const price = mapping.price || config.defaultPrice || 99
    const isPaid = mapping.isPaid !== undefined ? mapping.isPaid : (config.defaultIsPaid !== false)

    // Générer l'entrée
    const slug = generateSlug(sheetName)
    const description = mapping.description || 
      `Base de données complète avec ${sheetData.rowCount.toLocaleString()} entrées. ${sheetData.headers.length} champs par entrée : ${sheetData.headers.slice(0, 5).join(', ')}${sheetData.headers.length > 5 ? '...' : ''}. Idéal pour la prospection et l'analyse de marché.`

    const toolEntry = {
      name: `Base de données - ${sheetName}`,
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

    // Mettre à jour tools.js (simplifié, utiliser la fonction du script principal serait mieux)
    // Pour l'instant, on retourne juste les données générées
    // L'utilisateur peut ensuite lancer le script complet

    return res.status(200).json({
      success: true,
      message: 'Sheet analysé avec succès',
      data: {
        sheetData,
        toolEntry,
        slug,
        nextSteps: [
          'Lancez le script complet pour générer les fichiers',
          `node scripts/sync-google-sheets-marketplace.js --sheet-id=${sheetId}`
        ]
      }
    })

  } catch (error) {
    console.error('Erreur sync sheet:', error)
    return res.status(500).json({
      error: 'Erreur lors de la synchronisation',
      message: error.message
    })
  }
}

