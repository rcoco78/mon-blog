/**
 * Cron job Vercel pour enrichir automatiquement les Google Sheets marketplace
 * Exécuté quotidiennement (configuré dans vercel.json)
 * 
 * Ce cron job :
 * 1. Scanne les Google Sheets dans le Drive
 * 2. Enrichit les nouvelles bases ou met à jour les existantes
 * 3. Utilise GPT-4o mini pour générer descriptions, FAQ, etc.
 * 4. Synchronise les données vers Blob Storage
 */

const { main } = require('../../../scripts/enrich-marketplace-sheets')

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
    console.log('🚀 Démarrage du cron job d\'enrichissement marketplace...')
    
    // Vérifier si le token Blob est disponible
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('⚠️ BLOB_READ_WRITE_TOKEN non configuré. Les données seront uniquement sauvegardées localement.')
    }
    
    // Limiter à 2 sheets par exécution pour éviter timeout (300s max sur Vercel)
    // Les sheets restants seront traités lors du prochain cron
    process.argv = ['node', 'enrich-marketplace-sheets.js', '--limit=2']
    
    // Exécuter l'enrichissement
    // NOTE: Le script enrich-marketplace-sheets.js sauvegarde déjà dans Blob Storage après chaque traitement
    // Pas besoin de synchronisation finale, le script le fait déjà
    await main()
    
    console.log('✅ Cron job d\'enrichissement terminé avec succès')
    
    return res.status(200).json({
      success: true,
      message: 'Enrichissement marketplace terminé avec succès (2 sheets max par exécution)',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur lors du cron job d\'enrichissement:', error)
    return res.status(500).json({
      error: 'Erreur lors de l\'enrichissement',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

