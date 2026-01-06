// API pour récupérer toutes les vues de bases de données marketplace depuis les événements
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'marketplace-views-events.json'

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
    console.warn('Erreur lors de la récupération des événements de vues marketplace:', error)
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
    
    // Calculer les vues pour chaque slug (format: category/slug ou slug)
    const slugArray = slugs.split(',')
    const viewsMap = {}
    
    slugArray.forEach(slugWithCategory => {
      // Le format peut être "category/slug" ou juste "slug"
      const parts = slugWithCategory.split('/')
      const category = parts.length > 1 ? parts[0] : null
      const slug = parts.length > 1 ? parts[1] : parts[0]
      
      const viewKey = category ? `${category}/${slug}` : slug
      viewsMap[slugWithCategory] = events.filter(event => {
        const eventKey = event.category && event.slug ? `${event.category}/${event.slug}` : event.slug
        return eventKey === viewKey
      }).length
    })

    res.status(200).json(viewsMap)
  } catch (error) {
    console.error('Error fetching marketplace views:', error)
    res.status(500).json({ message: 'Error fetching views' })
  }
}

