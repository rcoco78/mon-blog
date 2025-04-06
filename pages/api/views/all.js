import { getPageViews } from '../../../lib/analytics'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { slugs } = req.query
    if (!slugs) {
      return res.status(400).json({ message: 'Slugs parameter is required' })
    }

    const slugArray = slugs.split(',')
    const viewsPromises = slugArray.map(slug => getPageViews(slug))
    const views = await Promise.all(viewsPromises)

    const viewsMap = slugArray.reduce((acc, slug, index) => {
      acc[slug] = views[index]
      return acc
    }, {})

    res.status(200).json(viewsMap)
  } catch (error) {
    console.error('Error fetching views:', error)
    res.status(500).json({ message: 'Error fetching views' })
  }
} 