import { put, list } from '@vercel/blob'

const BLOB_FILENAME = 'project-clicks.json'
const CLICKS_EVENTS_FILENAME = 'project-clicks-events.json'

/**
 * Stocke un événement de clic individuel (approche plus fiable)
 */
export async function addClickEvent(projectId) {
  try {
    // Vérifier si le token est disponible
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not set in environment variables')
      throw new Error('Blob not configured: BLOB_READ_WRITE_TOKEN missing')
    }
    
    // Récupérer les événements existants
    const events = await getClickEvents()
    
    // Ajouter le nouvel événement avec un ID unique
    const newEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      timestamp: Date.now()
    }
    
    events.push(newEvent)
    
    // Garder seulement les 1000 derniers événements pour éviter que le fichier devienne trop gros
    if (events.length > 1000) {
      events.splice(0, events.length - 1000)
    }
    
    // Sauvegarder les événements
    await put(CLICKS_EVENTS_FILENAME, JSON.stringify(events, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true, // Permettre l'écrasement du fichier existant
    })
    
    // Mettre à jour aussi le fichier de compteurs pour performance
    await updateClickCounters()
    
    return true
  } catch (error) {
    console.error('Error adding click event:', error)
    throw error
  }
}

/**
 * Récupère tous les événements de clics
 */
async function getClickEvents() {
  try {
    const blobs = await list({ prefix: CLICKS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find(blob => blob.pathname === CLICKS_EVENTS_FILENAME)

    if (!existingBlob) {
      // Pas de fichier existant, retourner un tableau vide
      return []
    }

    const response = await fetch(`${existingBlob.url}?t=${Date.now()}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch blob ${CLICKS_EVENTS_FILENAME}: ${response.status}`)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error getting click events:', error)
    console.error('Error details:', error.message, error.stack)
    return []
  }
}

/**
 * Met à jour les compteurs à partir des événements
 */
async function updateClickCounters() {
  try {
    const events = await getClickEvents()
    const counters = {}
    
    // Compter les clics par projet
    events.forEach(event => {
      counters[event.projectId] = (counters[event.projectId] || 0) + 1
    })
    
    // Sauvegarder les compteurs
    await put(BLOB_FILENAME, JSON.stringify(counters, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true, // Permettre l'écrasement du fichier existant
    })
    
    return counters
  } catch (error) {
    console.error('Error updating click counters:', error)
    return {}
  }
}

/**
 * Récupère les clics depuis Vercel Blob
 */
export async function getProjectClicks() {
  try {
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find(blob => blob.pathname === BLOB_FILENAME)

    if (!existingBlob) {
      // Si le fichier n'existe pas, calculer depuis les événements
      return await updateClickCounters()
    }

    const response = await fetch(`${existingBlob.url}?t=${Date.now()}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return {}
    }

    return await response.json() || {}
  } catch (error) {
    console.error('Error getting project clicks:', error)
    return {}
  }
}

/**
 * Incrémente le compteur de clics pour un projet
 * Utilise une approche basée sur les événements pour éviter les race conditions
 */
export async function incrementProjectClick(projectId) {
  try {
    // Ajouter un événement de clic (chaque clic est un événement unique)
    await addClickEvent(projectId)
    
    // Mettre à jour les compteurs et récupérer le nouveau total
    const counters = await updateClickCounters()
    const totalClicks = counters[projectId] || 0
    
    console.log(`✅ Click tracked for ${projectId}: ${totalClicks} total clicks`)
    return totalClicks
  } catch (error) {
    console.error('Error incrementing project click:', error)
    throw error
  }
}

/**
 * Récupère les clics pour plusieurs projets
 */
export async function getProjectClicksByIds(projectIds) {
  try {
    const clicks = await getProjectClicks()
    const result = {}
    
    projectIds.forEach(projectId => {
      result[projectId] = clicks[projectId] || 0
    })

    return result
  } catch (error) {
    console.error('Error getting project clicks by IDs:', error)
    // Retourner des zéros en cas d'erreur
    return projectIds.reduce((acc, projectId) => {
      acc[projectId] = 0
      return acc
    }, {})
  }
}

