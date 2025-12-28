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
    
    // Récupérer les compteurs actuels avec plusieurs tentatives pour éviter le cache
    let currentClicks = {}
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      currentClicks = await getProjectClicks()
      
      // Si on a récupéré des données ou si c'est la dernière tentative, on continue
      if (Object.keys(currentClicks).length > 0 || attempts === maxAttempts - 1) {
        break
      }
      
      // Petit délai avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
    
    const currentCount = currentClicks[projectId] || 0
    
    // Incrémenter directement le compteur
    const newCount = currentCount + 1
    
    console.log(`📊 Current count for ${projectId}: ${currentCount}, new count: ${newCount}`)
    
    // Mettre à jour les compteurs
    const updatedClicks = {
      ...currentClicks,
      [projectId]: newCount
    }
    
    // Sauvegarder les compteurs mis à jour
    await put(BLOB_FILENAME, JSON.stringify(updatedClicks, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    })
    
    // Optionnel : sauvegarder aussi l'événement pour l'historique
    // (mais on ne compte plus depuis les événements)
    try {
      const events = await getClickEvents()
      const newEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        timestamp: Date.now()
      }
      events.push(newEvent)
      
      // Garder seulement les 1000 derniers événements
      if (events.length > 1000) {
        events.splice(0, events.length - 1000)
      }
      
      await put(CLICKS_EVENTS_FILENAME, JSON.stringify(events, null, 2), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
      })
    } catch (eventError) {
      // Si l'ajout de l'événement échoue, ce n'est pas grave, on a déjà le compteur
      console.warn('Failed to save click event (non-critical):', eventError)
    }
    
    console.log(`📝 Added click for ${projectId}, new count: ${newCount}`)
    
    return newCount
  } catch (error) {
    console.error('Error adding click event:', error)
    throw error
  }
}

/**
 * Récupère tous les événements de clics
 * Utilise fetch() avec cache-busting agressif pour éviter les problèmes de cache
 */
async function getClickEvents() {
  try {
    const blobs = await list({ prefix: CLICKS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find(blob => blob.pathname === CLICKS_EVENTS_FILENAME)

    if (!existingBlob) {
      // Pas de fichier existant, retourner un tableau vide
      return []
    }

    // Cache-busting agressif avec timestamp + random + headers
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
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
 * Met à jour les compteurs à partir des événements (version avec événements passés en paramètre)
 */
async function updateClickCountersFromEvents(events) {
  try {
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
 * Met à jour les compteurs à partir des événements (version qui récupère les événements)
 */
async function updateClickCounters() {
  try {
    const events = await getClickEvents()
    return await updateClickCountersFromEvents(events)
  } catch (error) {
    console.error('Error updating click counters:', error)
    return {}
  }
}

/**
 * Récupère les clics depuis Vercel Blob
 * Utilise un cache-busting agressif pour éviter les problèmes de cache
 */
export async function getProjectClicks() {
  try {
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find(blob => blob.pathname === BLOB_FILENAME)

    if (!existingBlob) {
      // Si le fichier n'existe pas, retourner un objet vide
      return {}
    }

    // Cache-busting agressif avec timestamp + random + headers
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${BLOB_FILENAME}: ${response.status}`)
      return {}
    }

    const data = await response.json()
    return data || {}
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
    // addClickEvent incrémente directement le compteur et retourne le nouveau total
    const totalClicks = await addClickEvent(projectId)
    
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

