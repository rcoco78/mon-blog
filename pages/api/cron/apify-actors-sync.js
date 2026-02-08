/**
 * Cron job Vercel pour synchroniser et enrichir automatiquement les Actors Apify
 * Exécuté quotidiennement (configuré dans vercel.json)
 * 
 * Ce cron job :
 * 1. Récupère les actors Apify publiés
 * 2. Compare avec ceux déjà enregistrés
 * 3. Enrichit les nouveaux actors avec GPT-4o mini
 * 4. Génère des descriptions, cas d'usage, problèmes/solutions
 * 5. Synchronise les données vers Blob Storage
 */

const { main } = require('../../../scripts/enrich-apify-actors')

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
    console.log('🚀 Démarrage du cron job de synchronisation des actors Apify...')
    
    // Vérifier si le token Blob est disponible
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('⚠️ BLOB_READ_WRITE_TOKEN non configuré. Les données seront uniquement sauvegardées localement.')
    }
    
    // Vérifier si OpenAI est configuré
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY non configuré. L\'enrichissement GPT sera désactivé.')
    }
    
    // Exécuter la synchronisation et l'enrichissement
    await main()
    
    console.log('✅ Cron job de synchronisation des actors Apify terminé avec succès')
    
    return res.status(200).json({
      success: true,
      message: 'Synchronisation et enrichissement des actors Apify terminés avec succès',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur lors du cron job de synchronisation des actors Apify:', error)
    return res.status(500).json({
      error: 'Erreur lors de la synchronisation',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
