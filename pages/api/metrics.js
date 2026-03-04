// API route pour récupérer les métriques mises à jour
// Les métriques sont mises à jour par le cron job et stockées dans Vercel Blob Storage

import { list } from '@vercel/blob'
import { siteConfig } from '../../lib/config'

const BLOB_FILENAME = 'metrics.json'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Récupérer les métriques depuis Vercel Blob Storage
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find(blob => blob.pathname === BLOB_FILENAME)

    if (existingBlob) {
      const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })
      
      if (response.ok) {
        const data = await response.json()
        return res.status(200).json({
          success: true,
          metrics: data.metrics || [],
          lastUpdated: data.lastUpdated || null
        })
      }
    }
    
    // Fallback vers les métriques statiques si le blob n'existe pas encore
    return res.status(200).json({
      success: true,
      metrics: siteConfig.metrics,
      lastUpdated: null
    })
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

