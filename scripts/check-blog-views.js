// Script pour vérifier les vues du blog aujourd'hui et hier
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'blog-views-events.json'

async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      const response = await fetch(existingBlob.url, {
        method: 'GET',
        cache: 'no-store',
      })

      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data) ? data : []
      }
    }
    return []
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error)
    return []
  }
}

async function checkViews() {
  console.log('📊 Récupération des statistiques de vues du blog...\n')
  
  const events = await getViewEvents()
  console.log(`Total d'événements stockés: ${events.length}\n`)
  
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
  
  // Afficher les résultats
  console.log('📈 Statistiques de vues du blog:')
  console.log('─'.repeat(50))
  console.log(`Aujourd'hui (${today.toLocaleDateString('fr-FR')}): ${viewsToday} vues`)
  console.log(`Hier (${yesterday.toLocaleDateString('fr-FR')}): ${viewsYesterday} vues`)
  console.log(`Différence: ${difference > 0 ? '+' : ''}${difference} vues`)
  console.log('─'.repeat(50))
  
  // Détails par article aujourd'hui
  if (eventsToday.length > 0) {
    console.log('\n📝 Vues par article aujourd\'hui:')
    const viewsBySlug = {}
    eventsToday.forEach(event => {
      viewsBySlug[event.slug] = (viewsBySlug[event.slug] || 0) + 1
    })
    const sorted = Object.entries(viewsBySlug)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    sorted.forEach(([slug, count]) => {
      console.log(`  - ${slug}: ${count} vue${count > 1 ? 's' : ''}`)
    })
  }
  
  // Détails par article hier
  if (eventsYesterday.length > 0) {
    console.log('\n📝 Vues par article hier:')
    const viewsBySlug = {}
    eventsYesterday.forEach(event => {
      viewsBySlug[event.slug] = (viewsBySlug[event.slug] || 0) + 1
    })
    const sorted = Object.entries(viewsBySlug)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    sorted.forEach(([slug, count]) => {
      console.log(`  - ${slug}: ${count} vue${count > 1 ? 's' : ''}`)
    })
  }
}

checkViews().catch(console.error)

