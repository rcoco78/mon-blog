// API pour récupérer les statistiques du blog (nombre d'articles et vues totales) avec historique J-3
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
    console.warn('Erreur lors de la récupération des événements de vues:', error)
    return []
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { postsCount } = req.query
    
    // Récupérer tous les événements de vues
    const events = await getViewEvents()
    
    // Calculer les vues d'aujourd'hui (J) - somme de toutes les vues de tous les articles aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    
    // Filtrer les événements d'aujourd'hui (chaque événement = 1 vue d'un article)
    const eventsToday = events.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= today && eventDate <= todayEnd
    })
    
    // Le nombre total de vues aujourd'hui = nombre d'événements aujourd'hui
    // (car chaque événement représente 1 vue d'un article de blog)
    const viewsToday = eventsToday.length
    
    // Calculer les vues d'il y a 3 jours (J-3) - somme de toutes les vues de tous les articles il y a 3 jours
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    threeDaysAgo.setHours(0, 0, 0, 0)
    const threeDaysAgoEnd = new Date(threeDaysAgo)
    threeDaysAgoEnd.setHours(23, 59, 59, 999)
    
    // Filtrer les événements d'il y a 3 jours
    const eventsThreeDaysAgo = events.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= threeDaysAgo && eventDate <= threeDaysAgoEnd
    })
    
    // Le nombre total de vues il y a 3 jours = nombre d'événements il y a 3 jours
    const viewsThreeDaysAgo = eventsThreeDaysAgo.length
    
    // Calculer la différence absolue en nombre de vues (J vs J-3)
    // Exemple : si aujourd'hui = 39 vues (tous articles) et il y a 3 jours = 50 vues (tous articles)
    // alors différence = 39 - 50 = -11 vues
    const viewsDifference = viewsToday - viewsThreeDaysAgo
    
    // Calculer les vues totales (tous les événements)
    const totalViews = events.length
    
    // Pour le nombre d'articles, on utilise le postsCount passé en paramètre
    // (car on ne stocke pas l'historique du nombre d'articles)
    const articlesCount = parseInt(postsCount) || 0
    
    // Debug: logger les valeurs pour comprendre le calcul
    console.log('📊 Blog Stats (Vues articles de blog - comparaison J vs J-3):', {
      viewsToday: `${viewsToday} vues aujourd'hui (tous articles)`,
      viewsThreeDaysAgo: `${viewsThreeDaysAgo} vues il y a 3 jours (tous articles)`,
      viewsDifference: `${viewsDifference > 0 ? '+' : ''}${viewsDifference} vues`,
      totalEvents: `${events.length} événements au total (toutes dates)`,
      eventsTodayCount: eventsToday.length,
      eventsThreeDaysAgoCount: eventsThreeDaysAgo.length,
      todayRange: `${today.toISOString().split('T')[0]} 00:00 - 23:59`,
      threeDaysAgoRange: `${threeDaysAgo.toISOString().split('T')[0]} 00:00 - 23:59`
    })
    
    res.status(200).json({
      articlesCount,
      totalViews,
      viewsToday,
      viewsThreeDaysAgo,
      viewsDifference, // Différence absolue en nombre de vues (J - J-3)
      viewsIsPositive: viewsToday >= viewsThreeDaysAgo
    })
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    res.status(500).json({ message: 'Error fetching blog stats' })
  }
}

