import { put, list } from '@vercel/blob'

const BLOB_FILENAME = 'project-clicks.json'

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
      return {}
    }

    // Récupérer le contenu du fichier
    const response = await fetch(existingBlob.url)
    if (!response.ok) {
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
 */
export async function incrementProjectClick(projectId) {
  try {
    // Récupérer les clics actuels
    const clicks = await getProjectClicks()
    
    // Incrémenter le compteur
    const currentClicks = clicks[projectId] || 0
    clicks[projectId] = currentClicks + 1

    // Sauvegarder dans Blob
    const jsonData = JSON.stringify(clicks, null, 2)
    await put(BLOB_FILENAME, jsonData, {
      access: 'public',
      contentType: 'application/json',
    })

    return clicks[projectId]
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

