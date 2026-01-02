// Cron job pour synchroniser les Key Results et leur historique depuis Notion
// Exécuté toutes les 6 heures (configuré dans vercel.json)
// Cela évite les rate limits en limitant les appels à l'API Notion

import { getKeyResults, getKeyResultHistory } from '../../../lib/notion'
import { put } from '@vercel/blob'

const KEY_RESULTS_BLOB = 'key-results.json'
const HISTORY_PREFIX = 'key-results-history/'

export default async function handler(req, res) {
  // Vérifier que la requête vient de Vercel Cron
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

    console.log('🔄 Début de la synchronisation des Key Results...')

    // 1. Récupérer les Key Results depuis Notion
    const keyResults = await getKeyResults()
    console.log(`✅ ${keyResults.length} Key Results récupérés`)

    // 2. Sauvegarder les Key Results dans Blob Storage
    const keyResultsData = {
      keyResults,
      lastUpdated: new Date().toISOString()
    }
    
    await put(KEY_RESULTS_BLOB, JSON.stringify(keyResultsData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    })
    console.log(`✅ Key Results sauvegardés dans ${KEY_RESULTS_BLOB}`)

    // 3. Récupérer l'historique pour chaque Key Result (sur 30 jours)
    // On limite à 30 jours pour éviter trop d'appels API
    const historyPromises = keyResults
      .filter(kr => kr.id && kr.id !== 'chess-rapid-virtual')
      .slice(0, 50) // Limiter à 50 Key Results pour éviter les timeouts
      .map(async (kr) => {
        try {
          const history = await getKeyResultHistory(kr.id, 30)
          if (history.length > 0) {
            const historyData = {
              keyResultId: kr.id,
              keyResultName: kr.name,
              history,
              lastUpdated: new Date().toISOString()
            }
            
            const filename = `${HISTORY_PREFIX}${kr.id}.json`
            await put(filename, JSON.stringify(historyData, null, 2), {
              access: 'public',
              contentType: 'application/json',
              allowOverwrite: true,
            })
            
            return { keyResultId: kr.id, historyCount: history.length, success: true }
          }
          return { keyResultId: kr.id, historyCount: 0, success: true }
        } catch (error) {
          console.error(`❌ Erreur pour Key Result ${kr.id} (${kr.name}):`, error.message)
          return { keyResultId: kr.id, success: false, error: error.message }
        }
      })

    // Attendre que tous les historiques soient récupérés (avec un délai entre chaque pour éviter rate limit)
    const historyResults = []
    for (let i = 0; i < historyPromises.length; i++) {
      const result = await historyPromises[i]
      historyResults.push(result)
      
      // Attendre 200ms entre chaque requête pour éviter le rate limit
      if (i < historyPromises.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    const successful = historyResults.filter(r => r.success).length
    const withHistory = historyResults.filter(r => r.historyCount > 0).length
    const totalHistoryEntries = historyResults.reduce((sum, r) => sum + (r.historyCount || 0), 0)

    console.log(`✅ Synchronisation terminée :`)
    console.log(`   - ${keyResults.length} Key Results`)
    console.log(`   - ${successful}/${historyResults.length} historiques récupérés`)
    console.log(`   - ${withHistory} Key Results avec historique`)
    console.log(`   - ${totalHistoryEntries} entrées d'historique au total`)

    return res.status(200).json({
      success: true,
      message: `Synchronisation réussie`,
      keyResultsCount: keyResults.length,
      historyResults: {
        total: historyResults.length,
        successful,
        withHistory,
        totalHistoryEntries
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation des Key Results:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation',
      error: error.message
    })
  }
}

