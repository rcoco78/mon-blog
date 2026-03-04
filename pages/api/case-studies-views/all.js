// API pour récupérer toutes les vues de case studies depuis les événements
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'case-studies-views-events.json'

async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

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
    const events = await getViewEvents()

    // Si slugs manquant ou "*" : retourner la map complète (comme le blog)
    const { slugs } = req.query
    if (!slugs || slugs === '*') {
      const viewsMap = {}
      events.forEach((event) => {
        if (event.slug) {
          viewsMap[event.slug] = (viewsMap[event.slug] || 0) + 1
        }
      })
      return res.status(200).json(viewsMap)
    }

    // Sinon : filtrer par slugs demandés
    const slugArray = slugs.split(',')
    const viewsMap = {}
    slugArray.forEach((slug) => {
      viewsMap[slug] = events.filter((event) => event.slug === slug).length
    })

    res.status(200).json(viewsMap)
  } catch (error) {
    console.error('Error fetching views:', error)
    res.status(500).json({ message: 'Error fetching views' })
  }
}

