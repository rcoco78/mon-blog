// API route pour récupérer l'historique d'un Key Result
// Les données sont mises à jour par le cron job et stockées dans Vercel Blob Storage

import { list } from '@vercel/blob'
import { getKeyResultHistory } from '../../lib/notion'

const HISTORY_PREFIX = 'key-results-history/'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { keyResultId, days = 30 } = req.query

  if (!keyResultId) {
    return res.status(400).json({ error: 'keyResultId is required' })
  }

  try {
    // 1. Essayer de récupérer depuis Blob Storage (cache)
    try {
      const filename = `${HISTORY_PREFIX}${keyResultId}.json`
      const blobs = await list({ prefix: filename })
      const existingBlob = blobs.blobs.find(blob => blob.pathname === filename)

      if (existingBlob) {
        const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })
        
        if (response.ok) {
          const data = await response.json()
          if (data.history && Array.isArray(data.history)) {
            // Filtrer selon le nombre de jours demandé
            const requestedDays = parseInt(days)
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - requestedDays)
            cutoffDate.setHours(0, 0, 0, 0) // Réinitialiser à minuit pour une comparaison précise
            
            const filteredHistory = data.history
              .map(item => {
                // Normaliser la date : peut être une string ISO, un timestamp, ou un objet Date
                let itemDate
                if (item.date) {
                  itemDate = new Date(item.date)
                } else if (item.timestamp) {
                  itemDate = new Date(item.timestamp)
                } else {
                  return null // Ignorer les items sans date
                }
                
                // Vérifier que la date est valide
                if (isNaN(itemDate.getTime())) {
                  return null
                }
                
                return {
                  ...item,
                  date: item.date || itemDate.toISOString(),
                  timestamp: item.timestamp || itemDate.getTime()
                }
              })
              .filter(item => {
                if (!item) return false
                const itemDate = new Date(item.date || item.timestamp)
                return itemDate >= cutoffDate
              })
              .sort((a, b) => {
                // Trier par date croissante (plus ancien en premier)
                const dateA = new Date(a.date || a.timestamp).getTime()
                const dateB = new Date(b.date || b.timestamp).getTime()
                return dateA - dateB
              })
            
            console.log(`✅ Historique récupéré depuis Blob Storage pour ${keyResultId} (${filteredHistory.length}/${data.history.length} entrées sur ${requestedDays} jours)`)
            return res.status(200).json(filteredHistory)
          }
        }
      }
    } catch (blobError) {
      console.warn(`⚠️ Erreur lors de la récupération depuis Blob Storage pour ${keyResultId}, fallback vers Notion:`, blobError.message)
    }

    // 2. Fallback vers Notion si Blob Storage n'est pas disponible
    console.log(`🔄 Récupération de l'historique depuis Notion pour ${keyResultId} (fallback)`)
    const history = await getKeyResultHistory(keyResultId, parseInt(days))
    res.status(200).json(history)
  } catch (error) {
    console.error('Erreur API key-result-history:', error)
    
    // Si c'est un rate limit (429), retourner un tableau vide plutôt qu'une erreur
    const isRateLimit = error.message?.includes('rate_limited') || 
                       error.message?.includes('429') || 
                       error.status === 429 ||
                       error.code === 'rate_limited' ||
                       error.code === 'rate_limit_exceeded'
    
    if (isRateLimit) {
      console.warn(`⚠️ Rate limit détecté pour ${keyResultId}, retour d'un historique vide`)
      return res.status(200).json([])
    }
    
    // Pour les autres erreurs, retourner aussi un tableau vide
    return res.status(200).json([])
  }
}

