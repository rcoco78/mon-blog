// Cron job pour synchroniser les métriques depuis Notion
// Exécuté quotidiennement (configuré dans vercel.json)

import { getMetrics } from '../../../lib/notion'
import { put, list } from '@vercel/blob'

const BLOB_FILENAME = 'metrics.json'

export default async function handler(req, res) {
  // Vérifier que la requête vient de Vercel Cron
  // Vercel ajoute automatiquement le header 'x-vercel-cron' pour les cron jobs
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  
  // Si CRON_SECRET est configuré, Vercel l'envoie dans le header Authorization
  const hasValidSecret = process.env.CRON_SECRET 
    ? req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
    : false
  
  // Si aucun des deux n'est présent, refuser la requête
  if (!isVercelCron && !hasValidSecret) {
    return res.status(401).json({ 
      message: 'Unauthorized',
      hint: 'This endpoint can only be called by Vercel Cron. Configure CRON_SECRET in Vercel environment variables if testing manually.'
    })
  }

  try {
    // Vérifier si le token Blob est disponible
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not set in environment variables')
      throw new Error('Blob not configured: BLOB_READ_WRITE_TOKEN missing')
    }

    // Récupérer les métriques depuis Notion
    const notionMetrics = await getMetrics()
    
    // Transformer les métriques Notion au format attendu
    const metrics = notionMetrics.map(metric => ({
      value: metric.value,
      label: metric.label,
      source: metric.source
    }))

    // Sauvegarder les métriques dans Vercel Blob Storage
    const dataToSave = {
      metrics,
      lastUpdated: new Date().toISOString()
    }
    
    await put(BLOB_FILENAME, JSON.stringify(dataToSave, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    })
    
    console.log(`✅ Synchronisation métriques réussie : ${metrics.length} métriques récupérées`)
    
    return res.status(200).json({
      success: true,
      message: `Synchronisation réussie : ${metrics.length} métriques`,
      count: metrics.length,
      metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation des métriques:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation',
      error: error.message
    })
  }
}

