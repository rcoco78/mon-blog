/**
 * API Route pour récupérer les résultats d'un dataset Apify
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { datasetId, limit = 100, offset = 0, demo } = req.query

  if (!datasetId) {
    return res.status(400).json({ error: 'datasetId is required' })
  }
  
  // En mode démo, limiter à 5 résultats max
  const actualLimit = demo === 'true' ? Math.min(parseInt(limit) || 5, 5) : parseInt(limit) || 100

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

  if (!APIFY_API_TOKEN) {
    return res.status(500).json({ error: 'APIFY_API_TOKEN not configured' })
  }

  try {
    const response = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?limit=${actualLimit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Failed to get dataset items' 
      })
    }

    const items = await response.json()
    
    // Récupérer le total si disponible (pour savoir combien il y a au total)
    let totalCount = items.length
    try {
      const datasetInfo = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}`,
        {
          headers: {
            'Authorization': `Bearer ${APIFY_API_TOKEN}`
          }
        }
      )
      if (datasetInfo.ok) {
        const datasetData = await datasetInfo.json()
        totalCount = datasetData.data?.itemCount || items.length
      }
    } catch (e) {
      // Ignorer l'erreur, on utilise items.length
    }

    return res.status(200).json({
      success: true,
      items: items,
      count: items.length,
      totalCount: totalCount
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du dataset:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
