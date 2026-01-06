// API optimisée pour récupérer directement les top N bases de données les plus consultées
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
    const { limit = 3 } = req.query
    const topLimit = parseInt(limit, 10) || 3

    // Récupérer toutes les bases de données
    const { getAllDatabases } = await import('../../../lib/marketplace-databases')
    const databases = await getAllDatabases()

    // Récupérer tous les événements
    const events = await getViewEvents()
    
    // Calculer les vues pour toutes les bases (format: category/slug)
    const viewsMap = {}
    events.forEach(event => {
      if (event.slug) {
        const key = event.category && event.slug ? `${event.category}/${event.slug}` : event.slug
        viewsMap[key] = (viewsMap[key] || 0) + 1
      }
    })
    
    // Ajouter les vues aux bases de données et trier
    const databasesWithViews = databases.map(db => {
      const viewKey = db.category && db.slug ? `${db.category}/${db.slug}` : db.slug
      return {
        ...db,
        views: viewsMap[viewKey] || 0
      }
    })
    
    // Trier par nombre de vues (ordre décroissant) et prendre les top N
    // En cas d'égalité, trier par nom alphabétique pour un ordre stable
    const sorted = databasesWithViews
      .sort((a, b) => {
        if (b.views !== a.views) {
          return b.views - a.views // Ordre décroissant par nombre de vues
        }
        return a.name.localeCompare(b.name) // Tri alphabétique en cas d'égalité
      })
      .slice(0, topLimit)
    
    // Retourner seulement les données nécessaires
    const topDatabases = sorted.map(db => ({
      slug: db.slug,
      name: db.name,
      description: db.shortDescription || db.description,
      category: db.category,
      views: db.views,
      price: db.price,
      isPaid: db.isPaid
    }))

    res.status(200).json(topDatabases)
  } catch (error) {
    console.error('Error fetching top marketplace databases:', error)
    res.status(500).json({ message: 'Error fetching top databases' })
  }
}

