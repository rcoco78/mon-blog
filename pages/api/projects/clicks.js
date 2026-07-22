import { getProjectClicksByIds } from '../../../lib/projectClicks'
import { captureDataError } from '../../../lib/sentry'

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
    const clicksMap = await getProjectClicksByIds(projectIdArray)

    res.status(200).json(clicksMap)
  } catch (error) {
    captureDataError(error, { source: 'blob', tags: { area: 'project-clicks' } })
    console.error('Error fetching project clicks:', error)
    const projectIdArray = req.query.projectIds?.split(',') || []
    const clicksMap = projectIdArray.reduce((acc, projectId) => {
      acc[projectId] = 0
      return acc
    }, {})
    res.status(200).json(clicksMap)
  }
}
