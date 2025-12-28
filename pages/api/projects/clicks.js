import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { projectIds } = req.query

    if (!projectIds) {
      return res.status(400).json({ error: 'projectIds parameter is required' })
    }

    const projectIdArray = projectIds.split(',')
    const clicksPromises = projectIdArray.map(async (projectId) => {
      try {
        const key = `project:clicks:${projectId}`
        const clicks = await kv.get(key)
        return { projectId, clicks: clicks || 0 }
      } catch (error) {
        console.error(`Error fetching clicks for ${projectId}:`, error)
        return { projectId, clicks: 0 }
      }
    })

    const clicksData = await Promise.all(clicksPromises)
    const clicksMap = clicksData.reduce((acc, { projectId, clicks }) => {
      acc[projectId] = clicks
      return acc
    }, {})

    res.status(200).json(clicksMap)
  } catch (error) {
    console.error('Error fetching project clicks:', error)
    // En cas d'erreur (ex: KV non configuré), retourner des zéros
    const projectIdArray = req.query.projectIds?.split(',') || []
    const clicksMap = projectIdArray.reduce((acc, projectId) => {
      acc[projectId] = 0
      return acc
    }, {})
    res.status(200).json(clicksMap)
  }
}

