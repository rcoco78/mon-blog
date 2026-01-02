// API pour récupérer toutes les vues depuis les événements
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'blog-views-events.json'

async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data) ? data : []
      }
    }
    return []
  } catch (error) {
    console.warn('Erreur lors de la récupération des événements de vues:', error)
    return []
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { slugs } = req.query
    if (!slugs) {
      return res.status(400).json({ message: 'Slugs parameter is required' })
    }

    // Récupérer tous les événements
    const events = await getViewEvents()
    
    // Calculer les vues pour chaque slug
    const slugArray = slugs.split(',')
    const viewsMap = {}
    
    slugArray.forEach(slug => {
      viewsMap[slug] = events.filter(event => event.slug === slug).length
    })

    res.status(200).json(viewsMap)
  } catch (error) {
    console.error('Error fetching views:', error)
    res.status(500).json({ message: 'Error fetching views' })
  }
} 