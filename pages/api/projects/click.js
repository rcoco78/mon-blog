import { incrementProjectClick } from '../../../lib/projectClicks'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Gérer sendBeacon (données dans le body brut) et fetch normal (JSON)
    let projectId
    
    if (req.headers['content-type']?.includes('application/json')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      projectId = body.projectId
    } else {
      // Pour sendBeacon, le body peut être un Buffer
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : JSON.parse(req.body.toString())
      projectId = body.projectId
    }

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' })
    }

    // Incrémenter le compteur de clics
    const clicks = await incrementProjectClick(projectId)

    res.status(200).json({ clicks, projectId })
  } catch (error) {
    console.error('Error tracking project click:', error)
    // En cas d'erreur (ex: Blob non configuré), retourner quand même un succès
    // pour ne pas bloquer la navigation
    res.status(200).json({ clicks: 0, projectId: req.body?.projectId || 'unknown', error: 'Blob not configured' })
  }
}

