// API pour récupérer toutes les vues depuis les événements
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
    const { slugs } = req.query
    if (!slugs) {
      return res.status(400).json({ message: 'Slugs parameter is required' })
    }

    // Récupérer tous les événements
    const events = await getViewEvents()
    
    // Calculer les vues pour chaque slug
    const slugArray = slugs.split(',')
    const viewsMap = {}
    const dayDelta = {}
    const dayKey = (date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(date)
    const todayKey = dayKey(new Date())
    const yesterdayKey = dayKey(new Date(Date.now() - 86400000))

    slugArray.forEach((slug) => {
      let total = 0
      let today = 0
      let yesterday = 0
      for (const event of events) {
        if (event.slug !== slug) continue
        total += 1
        const key = dayKey(new Date(event.timestamp))
        if (key === todayKey) today += 1
        else if (key === yesterdayKey) yesterday += 1
      }
      viewsMap[slug] = total
      dayDelta[slug] = today - yesterday
    })

    res.status(200).json({ views: viewsMap, dayDelta })
  } catch (error) {
    console.error('Error fetching views:', error)
    res.status(500).json({ message: 'Error fetching views' })
  }
} 