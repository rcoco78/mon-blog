/**
 * API Route pour enrichir les Google Sheets avec GPT
 * Peut être appelée manuellement ou via webhook
 */

const { main } = require('../../../scripts/enrich-marketplace-sheets')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Vérifier l'authentification (optionnel)
  const authHeader = req.headers.authorization
  const expectedToken = process.env.MARKETPLACE_ENRICH_SECRET
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { sheetId, all } = req.body

    // Modifier les arguments pour le script
    if (sheetId) {
      process.argv = ['node', 'enrich-marketplace-sheets.js', `--sheet-id=${sheetId}`]
    } else if (all) {
      process.argv = ['node', 'enrich-marketplace-sheets.js', '--all']
    }

    // Exécuter l'enrichissement
    await main()

    return res.status(200).json({
      success: true,
      message: 'Enrichissement terminé avec succès'
    })

  } catch (error) {
    console.error('Erreur enrichissement:', error)
    return res.status(500).json({
      error: 'Erreur lors de l\'enrichissement',
      message: error.message
    })
  }
}

