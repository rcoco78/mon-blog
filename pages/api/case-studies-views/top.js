// API optimisée pour récupérer directement les top N case studies les plus consultés
import { list } from '@vercel/blob'
import { caseStudies } from '../../../lib/case-studies'

const VIEWS_EVENTS_FILENAME = 'case-studies-views-events.json'

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
    const { limit = 3 } = req.query
    const topLimit = parseInt(limit, 10) || 3

    // Récupérer tous les événements
    const events = await getViewEvents()
    
    // Calculer les vues pour tous les case studies
    const viewsMap = {}
    events.forEach(event => {
      if (event.slug) {
        viewsMap[event.slug] = (viewsMap[event.slug] || 0) + 1
      }
    })
    
    // Ajouter les vues aux case studies et trier
    const caseStudiesWithViews = caseStudies.map(cs => ({
      ...cs,
      views: viewsMap[cs.slug] || 0
    }))
    
    // Trier par nombre de vues (ordre décroissant) et prendre les top N
    // En cas d'égalité, trier par titre alphabétique pour un ordre stable
    const sorted = caseStudiesWithViews
      .sort((a, b) => {
        if (b.views !== a.views) {
          return b.views - a.views // Ordre décroissant par nombre de vues
        }
        return a.title.localeCompare(b.title) // Tri alphabétique en cas d'égalité
      })
      .slice(0, topLimit)
    
    // Retourner seulement les données nécessaires
    const topCaseStudies = sorted.map(cs => ({
      slug: cs.slug,
      title: cs.title,
      description: cs.description,
      sector: cs.sector,
      views: cs.views
    }))

    res.status(200).json(topCaseStudies)
  } catch (error) {
    console.error('Error fetching top case studies:', error)
    res.status(500).json({ message: 'Error fetching top case studies' })
  }
}










