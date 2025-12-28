import { put, list } from '@vercel/blob'

const BLOB_FILENAME = 'project-clicks.json'
const MAX_RETRIES = 5
const RETRY_DELAY = 100 // ms

/**
 * Récupère les clics depuis Vercel Blob avec l'URL du blob
 */
export async function getProjectClicks() {
  try {
    // Lister les fichiers pour trouver celui qui correspond
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find(blob => blob.pathname === BLOB_FILENAME)

    if (!existingBlob) {
      // Si le fichier n'existe pas, retourner un objet vide
      return { clicks: {}, url: null }
    }

    // Récupérer le contenu du fichier
    const response = await fetch(existingBlob.url)
    if (!response.ok) {
      return { clicks: {}, url: existingBlob.url }
    }

    const data = await response.json()
    return { clicks: data || {}, url: existingBlob.url }
  } catch (error) {
    console.error('Error getting project clicks:', error)
    return { clicks: {}, url: null }
  }
}

/**
 * Incrémente le compteur de clics pour un projet avec retry pour éviter les race conditions
 */
export async function incrementProjectClick(projectId) {
  let retries = 0
  
  while (retries < MAX_RETRIES) {
    try {
      // Récupérer les clics actuels avec l'URL
      const { clicks, url } = await getProjectClicks()
      
      // Incrémenter le compteur
      const currentClicks = clicks[projectId] || 0
      clicks[projectId] = currentClicks + 1

      // Sauvegarder dans Blob
      const jsonData = JSON.stringify(clicks, null, 2)
      
      // Vérifier à nouveau les clics juste avant l'écriture pour éviter les race conditions
      if (url) {
        const { clicks: latestClicks } = await getProjectClicks()
        // Si les clics ont changé entre temps, réessayer
        if (latestClicks[projectId] !== currentClicks) {
          retries++
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries))
          continue
        }
      }

      await put(BLOB_FILENAME, jsonData, {
        access: 'public',
        contentType: 'application/json',
      })

      return clicks[projectId]
    } catch (error) {
      console.error(`Error incrementing project click (attempt ${retries + 1}):`, error)
      retries++
      
      if (retries >= MAX_RETRIES) {
        throw error
      }
      
      // Attendre avant de réessayer (backoff exponentiel)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries))
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

