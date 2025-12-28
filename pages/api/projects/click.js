import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { projectId } = req.body

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' })
    }

    // Incrémenter le compteur de clics
    const key = `project:clicks:${projectId}`
    const clicks = await kv.incr(key)

    res.status(200).json({ clicks, projectId })
  } catch (error) {
    console.error('Error tracking project click:', error)
    // En cas d'erreur (ex: KV non configuré), retourner quand même un succès
    // pour ne pas bloquer la navigation
    res.status(200).json({ clicks: 0, projectId, error: 'KV not configured' })
  }
}

