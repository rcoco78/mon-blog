// API endpoint pour uploader des photos depuis iPhone
// Sécurisé avec un token secret

import { put, list } from '@vercel/blob'

const PHOTOS_JSON_FILENAME = 'photos.json'
const PHOTOS_FOLDER = 'photos'

export default async function handler(req, res) {
  // Vérifier la méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Vérifier le token de sécurité
  const authToken = req.headers.authorization?.replace('Bearer ', '')
  const expectedToken = process.env.PHOTOS_UPLOAD_SECRET

  if (!expectedToken || authToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { image, date, location, alt } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Image is required' })
    }

    // Convertir l'image base64 en buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Déterminer le type MIME
    const mimeType = image.match(/data:image\/(\w+);base64/)?.[1] || 'jpeg'
    const contentType = `image/${mimeType}`

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const extension = mimeType === 'jpeg' ? 'jpg' : mimeType
    const fileName = `${timestamp}-${randomId}.${extension}`
    const blobPath = `${PHOTOS_FOLDER}/${fileName}`

    // Uploader l'image dans Vercel Blob Storage
    const blob = await put(blobPath, imageBuffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    })

    // Préparer les métadonnées de la photo
    const photoData = {
      date: date || new Date().toISOString().split('T')[0],
      src: blob.url,
      alt: alt || 'Photo personnelle',
      location: location || null,
    }

    // Récupérer les photos existantes
    let existingPhotos = []
    try {
      const blobs = await list({ prefix: PHOTOS_JSON_FILENAME })
      const existingBlob = blobs.blobs.find((b) => b.pathname === PHOTOS_JSON_FILENAME)

      if (existingBlob) {
        const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        })

        if (response.ok) {
          const data = await response.json()
          existingPhotos = data.photos || []
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des photos existantes:', error)
    }

    // Ajouter la nouvelle photo au début (plus récente en premier)
    existingPhotos.unshift(photoData)

    // Sauvegarder la liste mise à jour
    await put(
      PHOTOS_JSON_FILENAME,
      JSON.stringify(
        {
          photos: existingPhotos,
          lastUpdated: new Date().toISOString(),
        },
        null,
        2
      ),
      { access: 'public', allowOverwrite: true }
    )

    console.log(`[photos-upload] Photo uploadée: ${blob.url}`)

    return res.status(200).json({
      success: true,
      photo: photoData,
      message: 'Photo uploadée avec succès',
    })
  } catch (error) {
    console.error('[photos-upload] Erreur:', error)
    return res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' })
  }
}

