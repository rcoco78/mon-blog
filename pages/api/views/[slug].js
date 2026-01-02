// API pour gérer les vues d'articles - Stocke dans Blob Storage et incrémente à chaque requête
import { put, list } from '@vercel/blob'

const VIEWS_FILENAME = 'blog-views.json'

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

async function incrementView(slug) {
  try {
    const views = await getViews()
    
    // Initialiser si nécessaire
    if (!views[slug]) {
      views[slug] = 0
    }
    
    // Incrémenter
    views[slug] = (views[slug] || 0) + 1
    views._lastUpdate = new Date().toISOString()
    
    // Sauvegarder dans Blob Storage
    await put(
      VIEWS_FILENAME,
      JSON.stringify(views, null, 2),
      { access: 'public', allowOverwrite: true }
    )
    
    return views[slug]
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
    
    // Incrémenter la vue et récupérer le nouveau total
    const views = await incrementView(cleanSlug)
    
    res.status(200).json({ views })
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