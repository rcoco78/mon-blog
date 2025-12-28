import { put, list, head } from '@vercel/blob'

const BLOB_FILENAME = 'project-clicks.json'
const MAX_RETRIES = 10
const RETRY_DELAY = 50 // ms

/**
 * Récupère les clics depuis Vercel Blob avec le timestamp du blob
 */
export async function getProjectClicks() {
  try {
    // Lister les fichiers pour trouver celui qui correspond
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find(blob => blob.pathname === BLOB_FILENAME)

    if (!existingBlob) {
      // Si le fichier n'existe pas, retourner un objet vide
      return { clicks: {}, etag: null, uploadedAt: null }
    }

    // Récupérer les métadonnées du blob pour obtenir l'ETag et le timestamp
    const blobInfo = await head(BLOB_FILENAME)
    
    // Récupérer le contenu du fichier
    const response = await fetch(existingBlob.url, {
      headers: {
        'If-None-Match': blobInfo.etag || ''
      }
    })
    
    if (!response.ok) {
      return { clicks: {}, etag: blobInfo.etag, uploadedAt: blobInfo.uploadedAt }
    }

    const data = await response.json()
    return { 
      clicks: data || {}, 
      etag: blobInfo.etag,
      uploadedAt: blobInfo.uploadedAt?.getTime() || Date.now()
    }
  } catch (error) {
    console.error('Error getting project clicks:', error)
    return { clicks: {}, etag: null, uploadedAt: null }
  }
}

/**
 * Incrémente le compteur de clics pour un projet avec retry et vérification d'ETag
 */
export async function incrementProjectClick(projectId) {
  let retries = 0
  
  while (retries < MAX_RETRIES) {
    try {
      // Récupérer les clics actuels avec l'ETag et le timestamp
      const { clicks, etag, uploadedAt } = await getProjectClicks()
      
      // Incrémenter le compteur
      const currentClicks = clicks[projectId] || 0
      const newClicks = currentClicks + 1
      clicks[projectId] = newClicks

      // Sauvegarder dans Blob
      const jsonData = JSON.stringify(clicks, null, 2)
      
      // Vérifier que le blob n'a pas été modifié entre temps
      if (etag) {
        const currentBlob = await head(BLOB_FILENAME)
        const currentUploadedAt = currentBlob.uploadedAt?.getTime() || 0
        
        // Si le blob a été modifié depuis notre lecture, réessayer
        if (currentUploadedAt > uploadedAt) {
          retries++
          // Délai aléatoire pour éviter les collisions
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries + Math.random() * 50))
          continue
        }
      }

      // Écrire le nouveau fichier
      await put(BLOB_FILENAME, jsonData, {
        access: 'public',
        contentType: 'application/json',
      })

      return newClicks
    } catch (error) {
      console.error(`Error incrementing project click (attempt ${retries + 1}):`, error)
      retries++
      
      if (retries >= MAX_RETRIES) {
        throw error
      }
      
      // Attendre avant de réessayer avec un délai aléatoire
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries + Math.random() * 50))
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

