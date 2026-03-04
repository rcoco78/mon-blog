// API route pour récupérer les Key Results
// Les données sont mises à jour par le cron job et stockées dans Vercel Blob Storage

import { list } from '@vercel/blob'
import { getKeyResults } from '../../lib/notion'

const BLOB_FILENAME = 'key-results.json'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. Essayer de récupérer depuis Blob Storage (cache)
    try {
      const blobs = await list({ prefix: BLOB_FILENAME })
      const existingBlob = blobs.blobs.find(blob => blob.pathname === BLOB_FILENAME)

      if (existingBlob) {
        const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })
        
        if (response.ok) {
          const data = await response.json()
          if (data.keyResults && Array.isArray(data.keyResults)) {
            console.log(`✅ Key Results récupérés depuis Blob Storage (${data.keyResults.length} résultats, mis à jour: ${data.lastUpdated})`)
            return res.status(200).json(data.keyResults)
          }
        }
      }
    } catch (blobError) {
      console.warn('⚠️ Erreur lors de la récupération depuis Blob Storage, fallback vers Notion:', blobError.message)
    }

    // 2. Fallback vers Notion si Blob Storage n'est pas disponible
    console.log('🔄 Récupération des Key Results depuis Notion (fallback)')
    const keyResults = await getKeyResults()
    res.status(200).json(keyResults)
  } catch (error) {
    console.error('Erreur API key-results:', error)
    
    // Si c'est un rate limit (429), retourner un tableau vide plutôt qu'une erreur
    const isRateLimit = error.message?.includes('rate_limited') || 
                       error.message?.includes('429') || 
                       error.status === 429 ||
                       error.code === 'rate_limited' ||
                       error.code === 'rate_limit_exceeded'
    
    if (isRateLimit) {
      console.warn('⚠️ Rate limit détecté, retour de valeurs par défaut')
      return res.status(200).json([])
    }
    
    // Pour les autres erreurs, retourner aussi un tableau vide pour ne pas bloquer l'interface
    return res.status(200).json([])
  }
}

