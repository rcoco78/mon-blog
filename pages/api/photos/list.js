// API endpoint pour récupérer la liste des photos depuis Blob Storage

import { list } from '@vercel/blob'

const PHOTOS_JSON_FILENAME = 'photos.json'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Récupérer le fichier JSON depuis Blob Storage
    const blobs = await list({ prefix: PHOTOS_JSON_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === PHOTOS_JSON_FILENAME)

    if (!existingBlob) {
      return res.status(200).json({ photos: [], message: 'Aucune photo trouvée' })
    }

    // Charger le contenu avec cache-buster
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    })

    if (!response.ok) {
      return res.status(200).json({ photos: [], message: 'Erreur lors du chargement' })
    }

    const data = await response.json()
    const photos = data.photos || []

    // Trier par date décroissante (plus récent en premier)
    const sortedPhotos = photos.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB - dateA
    })

    return res.status(200).json({
      photos: sortedPhotos,
      lastUpdated: data.lastUpdated,
    })
  } catch (error) {
    console.error('[photos-list] Erreur:', error)
    return res.status(500).json({ error: 'Erreur lors de la récupération des photos' })
  }
}

