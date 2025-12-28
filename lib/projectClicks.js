import { put, list } from '@vercel/blob'

const BLOB_FILENAME = 'project-clicks.json'
const MAX_RETRIES = 15
const RETRY_DELAY = 100 // ms

/**
 * Récupère les clics depuis Vercel Blob
 */
export async function getProjectClicks() {
  try {
    // Lister les fichiers pour trouver celui qui correspond
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find(blob => blob.pathname === BLOB_FILENAME)

    if (!existingBlob) {
      // Si le fichier n'existe pas, retourner un objet vide
      return { clicks: {}, lastModified: null }
    }

    // Récupérer le contenu du fichier avec un cache-busting
    const response = await fetch(`${existingBlob.url}?t=${Date.now()}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return { clicks: {}, lastModified: existingBlob.uploadedAt?.getTime() || null }
    }

    const data = await response.json()
    return { 
      clicks: data || {}, 
      lastModified: existingBlob.uploadedAt?.getTime() || Date.now()
    }
  } catch (error) {
    console.error('Error getting project clicks:', error)
    return { clicks: {}, lastModified: null }
  }
}

/**
 * Incrémente le compteur de clics pour un projet avec retry optimiste
 * Utilise une approche "optimistic locking" avec vérification du timestamp
 */
export async function incrementProjectClick(projectId) {
  let retries = 0
  
  while (retries < MAX_RETRIES) {
    try {
      // Récupérer les clics actuels avec le timestamp
      const { clicks, lastModified } = await getProjectClicks()
      
      // Incrémenter le compteur
      const currentClicks = clicks[projectId] || 0
      const newClicks = currentClicks + 1
      clicks[projectId] = newClicks

      // Sauvegarder dans Blob
      const jsonData = JSON.stringify(clicks, null, 2)
      
      // Vérifier une dernière fois que le fichier n'a pas été modifié
      if (lastModified) {
        const { lastModified: currentModified } = await getProjectClicks()
        
        // Si le fichier a été modifié depuis notre lecture, réessayer
        if (currentModified && currentModified > lastModified) {
          retries++
          // Délai exponentiel avec jitter pour éviter les collisions
          const delay = RETRY_DELAY * Math.pow(2, retries) + Math.random() * 100
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }

      // Écrire le nouveau fichier
      await put(BLOB_FILENAME, jsonData, {
        access: 'public',
        contentType: 'application/json',
      })

      console.log(`✅ Click tracked for ${projectId}: ${newClicks} clicks`)
      return newClicks
    } catch (error) {
      console.error(`Error incrementing project click (attempt ${retries + 1}):`, error)
      retries++
      
      if (retries >= MAX_RETRIES) {
        console.error(`Max retries reached for ${projectId}`)
        throw error
      }
      
      // Attendre avant de réessayer avec un délai exponentiel et jitter
      const delay = RETRY_DELAY * Math.pow(2, retries) + Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Max retries reached')
}

/**
 * Récupère les clics pour plusieurs projets
 */
export async function getProjectClicksByIds(projectIds) {
  try {
    const { clicks } = await getProjectClicks()
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

