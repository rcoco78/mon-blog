/**
 * API Route pour synchroniser manuellement le fichier local vers Blob Storage
 * Utile pour corriger un Blob Storage vide ou mettre à jour les données
 * 
 * Usage: POST /api/marketplace/sync-blob
 * Headers: Authorization: Bearer <CRON_SECRET>
 */

import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const BLOB_FILENAME = 'marketplace-databases.json'
const DATABASES_FILE = path.join(process.cwd(), 'data', 'marketplace-databases.json')

export default async function handler(req, res) {
  // Vérifier l'autorisation
  const hasValidSecret = process.env.CRON_SECRET 
    ? req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
    : false
  
  if (!hasValidSecret) {
    return res.status(401).json({ 
      message: 'Unauthorized',
      hint: 'Configurez CRON_SECRET dans les variables d\'environnement Vercel'
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ 
        error: 'BLOB_READ_WRITE_TOKEN non configuré' 
      })
    }

    // Charger depuis le fichier local
    let databases = []
    if (fs.existsSync(DATABASES_FILE)) {
      const data = fs.readFileSync(DATABASES_FILE, 'utf8')
      const parsed = JSON.parse(data)
      databases = Array.isArray(parsed) ? parsed : (parsed.databases || [])
      console.log(`📁 ${databases.length} base(s) de données chargée(s) depuis fichier local`)
    } else {
      return res.status(404).json({ 
        error: 'Fichier local non trouvé',
        path: DATABASES_FILE
      })
    }

    // Sauvegarder dans Blob Storage
    const dataToSave = {
      databases,
      lastUpdated: new Date().toISOString(),
      count: databases.length
    }
    
    await put(BLOB_FILENAME, JSON.stringify(dataToSave, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true
    })
    
    console.log(`✅ ${databases.length} base(s) de données synchronisée(s) vers Blob Storage`)
    
    return res.status(200).json({
      success: true,
      message: `${databases.length} base(s) de données synchronisée(s) vers Blob Storage`,
      count: databases.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    return res.status(500).json({
      error: 'Erreur lors de la synchronisation',
      message: error.message
    })
  }
}

