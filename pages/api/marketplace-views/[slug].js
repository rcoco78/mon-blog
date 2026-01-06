// API pour gérer les vues de bases de données marketplace - Stocke dans Blob Storage avec système d'événements
// Structure : /category/slug (comme les case studies)
import { put, list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'marketplace-views-events.json'

// Récupérer les événements de vues (source de vérité)
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

// Calculer les vues depuis les événements
async function calculateViewsFromEvents() {
  try {
    const events = await getViewEvents()
    const views = {}
    events.forEach(event => {
      const key = event.category && event.slug ? `${event.category}/${event.slug}` : event.slug
      if (!views[key]) {
        views[key] = 0
      }
      views[key]++
    })
    return views
  } catch (error) {
    console.warn('Erreur lors du calcul des vues depuis les événements:', error)
    return {}
  }
}

// Incrémenter la vue avec système d'événements (évite les race conditions)
async function incrementView(slug, category = null) {
  try {
    // Si la catégorie n'est pas fournie, la récupérer depuis la base de données
    if (!category) {
      const { getDatabaseBySlug } = await import('../../../lib/marketplace-databases')
      const database = await getDatabaseBySlug(slug)
      if (database) {
        category = database.category
      }
    }
    
    // Récupérer les événements existants
    const events = await getViewEvents()
    
    // Ajouter le nouvel événement avec la catégorie
    const newEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      slug,
      category: category || null, // Stocker la catégorie si disponible
      timestamp: Date.now()
    }
    events.push(newEvent)
    
    // Garder seulement les 5000 derniers événements pour éviter un fichier trop gros
    if (events.length > 5000) {
      events.splice(0, events.length - 5000)
    }
    
    // Sauvegarder les événements (source de vérité)
    await put(
      VIEWS_EVENTS_FILENAME,
      JSON.stringify(events, null, 2),
      { access: 'public', allowOverwrite: true }
    )
    
    // Attendre un peu pour que la sauvegarde soit propagée
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Calculer les compteurs depuis tous les événements
    const views = {}
    events.forEach(event => {
      const key = event.category && event.slug ? `${event.category}/${event.slug}` : event.slug
      if (!views[key]) {
        views[key] = 0
      }
      views[key]++
    })
    
    const viewKey = category && slug ? `${category}/${slug}` : slug
    return views[viewKey] || 0
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation des vues marketplace:', error)
    throw error
  }
}

export default async function handler(req, res) {
  const { slug } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' })
  }

  try {
    // Désactiver le cache pour avoir toujours les données à jour
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    
    // Nettoyer le slug
    const cleanSlug = slug.replace(/\//g, '')
    
    // Récupérer la catégorie si fournie en paramètre
    const category = req.query.category || null
    
    // Vérifier si on doit incrémenter (paramètre ?increment=true)
    const shouldIncrement = req.query.increment === 'true'
    
    if (shouldIncrement) {
      // Incrémenter la vue et récupérer le nouveau total
      const views = await incrementView(cleanSlug, category)
      res.status(200).json({ views })
    } else {
      // Juste récupérer les vues sans incrémenter
      // Calculer depuis les événements pour avoir les données les plus récentes
      const events = await getViewEvents()
      const viewKey = category && cleanSlug ? `${category}/${cleanSlug}` : cleanSlug
      const views = events.filter(event => {
        const eventKey = event.category && event.slug ? `${event.category}/${event.slug}` : event.slug
        return eventKey === viewKey
      }).length
      res.status(200).json({ views })
    }
  } catch (error) {
    console.error('Error fetching/incrementing marketplace views:', error)
    // En cas d'erreur, essayer de calculer depuis les événements
    try {
      const viewsData = await calculateViewsFromEvents()
      const category = req.query.category || null
      const viewKey = category && slug ? `${category}/${slug}` : slug
      const views = viewsData[viewKey] || 0
      res.status(200).json({ views })
    } catch (fallbackError) {
      res.status(500).json({ error: 'Error fetching views', views: 0 })
    }
  }
}

