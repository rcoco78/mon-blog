// API pour afficher les statistiques de vues du blog de manière détaillée
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'blog-views-events.json'

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
    console.warn('Erreur lors de la récupération des événements:', error)
    return []
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const events = await getViewEvents()
    
    // Calculer les vues d'aujourd'hui (J)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    
    const eventsToday = events.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= today && eventDate <= todayEnd
    })
    
    const viewsToday = eventsToday.length
    
    // Calculer les vues d'hier (J-1)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)
    
    const eventsYesterday = events.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= yesterday && eventDate <= yesterdayEnd
    })
    
    const viewsYesterday = eventsYesterday.length
    
    // Calculer la différence
    const difference = viewsToday - viewsYesterday
    
    // Détails par article aujourd'hui
    const viewsBySlugToday = {}
    eventsToday.forEach(event => {
      viewsBySlugToday[event.slug] = (viewsBySlugToday[event.slug] || 0) + 1
    })
    const topArticlesToday = Object.entries(viewsBySlugToday)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, count]) => ({ slug, views: count }))
    
    // Détails par article hier
    const viewsBySlugYesterday = {}
    eventsYesterday.forEach(event => {
      viewsBySlugYesterday[event.slug] = (viewsBySlugYesterday[event.slug] || 0) + 1
    })
    const topArticlesYesterday = Object.entries(viewsBySlugYesterday)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, views]) => ({ slug, views }))
    
    res.status(200).json({
      summary: {
        viewsToday,
        viewsYesterday,
        difference,
        totalEvents: events.length,
        todayDate: today.toISOString().split('T')[0],
        yesterdayDate: yesterday.toISOString().split('T')[0]
      },
      topArticlesToday,
      topArticlesYesterday
    })
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    res.status(500).json({ message: 'Error fetching blog stats', error: error.message })
  }
}

