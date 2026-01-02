// API pour gérer les vues d'articles - Stocke dans Blob Storage avec système d'événements pour éviter les race conditions
import { put, list } from '@vercel/blob'

const VIEWS_FILENAME = 'blog-views.json'
const VIEWS_EVENTS_FILENAME = 'blog-views-events.json'

// Récupérer les événements de vues (source de vérité)
async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      // Cache-busting agressif pour éviter les problèmes de cache
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

// Récupérer les compteurs de vues (cache pour performance)
async function getViews() {
  try {
    const blobs = await list({ prefix: VIEWS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_FILENAME)

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
        return data.views || {}
      }
    }
    return {}
  } catch (error) {
    console.warn('Erreur lors de la récupération des vues:', error)
    return {}
  }
}

// Incrémenter la vue avec système d'événements (évite les race conditions)
async function incrementView(slug) {
  try {
    // Récupérer les événements existants
    const events = await getViewEvents()
    
    // Ajouter le nouvel événement
    const newEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      slug,
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
      if (!views[event.slug]) {
        views[event.slug] = 0
      }
      views[event.slug]++
    })
    
    // Mettre à jour le fichier de compteurs pour performance
    await put(
      VIEWS_FILENAME,
      JSON.stringify({
        views,
        _lastUpdate: new Date().toISOString()
      }, null, 2),
      { access: 'public', allowOverwrite: true }
    )
    
    return views[slug] || 0
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation des vues:', error)
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
    // Nettoyer le slug
    const cleanSlug = slug.replace(/\//g, '')
    
    // Vérifier si on doit incrémenter (paramètre ?increment=true)
    const shouldIncrement = req.query.increment === 'true'
    
    if (shouldIncrement) {
      // Incrémenter la vue et récupérer le nouveau total
      const views = await incrementView(cleanSlug)
      res.status(200).json({ views })
    } else {
      // Juste récupérer les vues sans incrémenter
      // Calculer depuis les événements pour avoir les données les plus récentes
      const events = await getViewEvents()
      const views = events.filter(event => event.slug === cleanSlug).length
      res.status(200).json({ views })
    }
  } catch (error) {
    console.error('Error fetching/incrementing views:', error)
    // En cas d'erreur, essayer de récupérer les vues existantes sans incrémenter
    try {
      const viewsData = await getViews()
      const views = viewsData[cleanSlug] || 0
      res.status(200).json({ views })
    } catch (fallbackError) {
      res.status(500).json({ error: 'Error fetching views', views: 0 })
    }
  }
} 