// API route pour récupérer les métriques mises à jour
// Les métriques sont mises à jour par le cron job et stockées dans data/metrics.json

import fs from 'fs'
import path from 'path'
import { siteConfig } from '../../lib/config'

const metricsFilePath = path.join(process.cwd(), 'data', 'metrics.json')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Lire les métriques depuis le fichier JSON
    if (fs.existsSync(metricsFilePath)) {
      const fileContent = fs.readFileSync(metricsFilePath, 'utf8')
      const data = JSON.parse(fileContent)
      
      return res.status(200).json({
        success: true,
        metrics: data.metrics || [],
        lastUpdated: data.lastUpdated || null
      })
    } else {
      // Fallback vers les métriques statiques si le fichier n'existe pas encore
      return res.status(200).json({
        success: true,
        metrics: siteConfig.metrics,
        lastUpdated: null
      })
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error)
    
    // Fallback vers les métriques statiques en cas d'erreur
    return res.status(200).json({
      success: true,
      metrics: siteConfig.metrics,
      lastUpdated: null,
      error: 'Using fallback metrics'
    })
  }
}

