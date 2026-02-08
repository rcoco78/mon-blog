/**
 * API Route pour lancer un actor Apify
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { actorId, input } = req.body

  if (!actorId) {
    return res.status(400).json({ error: 'actorId is required' })
  }

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

  if (!APIFY_API_TOKEN) {
    return res.status(500).json({ error: 'APIFY_API_TOKEN not configured' })
  }

  try {
    // L'actorId peut être au format "username/actor-name" ou l'ID numérique
    // L'API Apify utilise le tilde "~" pour remplacer le slash "/" dans les URLs
    // Exemple: "username/actor-name" devient "username~actor-name"
    let actorEndpoint = actorId
    if (actorId.includes('/')) {
      actorEndpoint = actorId.replace(/\//g, '~')
    }
    
    console.log(`🚀 Lancement de l'actor: ${actorId} -> endpoint: ${actorEndpoint}`)
    
    // Lancer l'actor
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorEndpoint}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input || {})
    })

    if (!runResponse.ok) {
      let errorMessage = 'Failed to run actor'
      try {
        const errorData = await runResponse.json()
        errorMessage = errorData.error?.message || errorData.message || errorMessage
        console.error(`❌ Erreur API Apify (${runResponse.status}):`, errorMessage)
      } catch (e) {
        const errorText = await runResponse.text()
        console.error(`❌ Erreur API Apify (${runResponse.status}):`, errorText)
        errorMessage = errorText || errorMessage
      }
      
      return res.status(runResponse.status).json({ 
        error: errorMessage,
        actorId: actorId,
        status: runResponse.status
      })
    }

    const runData = await runResponse.json()
    console.log('📦 Réponse API Apify:', JSON.stringify(runData, null, 2))

    // La structure de la réponse Apify peut varier
    // Vérifier si c'est runData.data ou runData directement
    const run = runData.data || runData
    const runId = run.id
    const datasetId = run.defaultDatasetId
    let runStatus = run.status || 'RUNNING'

    // Si waitForFinish n'est pas utilisé, attendre manuellement
    if (runStatus === 'RUNNING') {
      let attempts = 0
      const maxAttempts = 60 // 60 secondes max

      while (runStatus === 'RUNNING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Attendre 1 seconde

        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${APIFY_API_TOKEN}`
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          const statusRun = statusData.data || statusData
          runStatus = statusRun.status || runStatus
        }

        attempts++
      }
    }

    return res.status(200).json({
      success: true,
      runId: runData.data.id,
      datasetId: datasetId,
      status: runStatus
    })
  } catch (error) {
    console.error('Erreur lors de l\'exécution de l\'actor:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
