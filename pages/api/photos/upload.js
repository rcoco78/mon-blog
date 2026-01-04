// API endpoint pour uploader des photos depuis iPhone
// Sécurisé avec un token secret
// Accepte FormData multipart (recommandé) ou JSON base64 (legacy)

import { put, list } from '@vercel/blob'
import formidable from 'formidable'
import fs from 'fs'

const PHOTOS_JSON_FILENAME = 'photos.json'
const PHOTOS_FOLDER = 'photos'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB (limite Vercel: 4.5 MB pour le body, mais on peut accepter plus avec FormData)

// Désactiver le bodyParser pour parser FormData manuellement
export const config = {
  api: {
    bodyParser: false,
  },
}

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
    const contentType = req.headers['content-type'] || ''
    let imageBuffer
    let contentType_image = 'image/jpeg'
    let date, location, alt

    // Vérifier si c'est FormData (multipart/form-data) ou JSON (legacy)
    // Shortcuts peut envoyer FormData avec ou sans Content-Type explicite
    // On détecte FormData par la présence de multipart/form-data OU si le body n'est pas du JSON valide
    const isFormData = contentType.includes('multipart/form-data')
    
    // Log pour debug
    console.log('[photos-upload] Content-Type:', contentType)
    console.log('[photos-upload] Content-Length:', req.headers['content-length'])
    
    if (isFormData) {
      try {
        // Parser FormData avec formidable
        const form = formidable({
          maxFileSize: MAX_FILE_SIZE,
          keepExtensions: true,
        })

        const [fields, files] = await form.parse(req)
        
        console.log('[photos-upload] FormData parsé - Fields:', Object.keys(fields), 'Files:', Object.keys(files))

        // Récupérer le fichier image
        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image
        if (!imageFile) {
          return res.status(400).json({ error: 'Image is required (champ "image"). Vérifie que le champ FormData s\'appelle bien "image".' })
        }

        // Lire le fichier
        const fileData = fs.readFileSync(imageFile.filepath)
        imageBuffer = Buffer.from(fileData)

        // Déterminer le type MIME
        contentType_image = imageFile.mimetype || 'image/jpeg'

        // Récupérer les métadonnées
        date = Array.isArray(fields.date) ? fields.date[0] : fields.date
        location = Array.isArray(fields.location) ? fields.location[0] : fields.location
        alt = Array.isArray(fields.alt) ? fields.alt[0] : fields.alt

        // Nettoyer le fichier temporaire
        if (fs.existsSync(imageFile.filepath)) {
          fs.unlinkSync(imageFile.filepath)
        }
      } catch (formError) {
        console.error('[photos-upload] Erreur parsing FormData:', formError)
        // Si le parsing FormData échoue, essayer JSON
        if (formError.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Fichier trop volumineux' })
        }
        // Fallback vers JSON si FormData échoue
        console.log('[photos-upload] Fallback vers JSON')
      }
    }
    
    // Si pas de FormData ou si FormData a échoué, essayer JSON
    if (!imageBuffer) {
      // Format JSON legacy (base64) - pour compatibilité
      const { buffer } = await import('micro')
      
      const bodyBuffer = await buffer(req, { limit: '4.5mb' })
      const bodyString = bodyBuffer.toString('utf-8')

      if (bodyBuffer.length > 4.5 * 1024 * 1024) {
        return res.status(413).json({
          error: `Requête trop grande (${Math.round(bodyBuffer.length / 1024 / 1024 * 100) / 100} MB). Maximum: 4.5 MB. Utilisez FormData multipart pour les fichiers plus grands.`,
        })
      }

      let body
      try {
        body = JSON.parse(bodyString)
      } catch (error) {
        console.error('[photos-upload] Erreur parsing JSON:', error)
        console.error('[photos-upload] Content-Type:', contentType)
        console.error('[photos-upload] Body preview:', bodyString.substring(0, 200))
        return res.status(400).json({ 
          error: 'Invalid JSON body. Si tu utilises FormData, vérifie que le Content-Type est bien "multipart/form-data" et que le champ s\'appelle "image".' 
        })
      }

      const { image, date: dateParam, location: locationParam, alt: altParam } = body

      if (!image) {
        return res.status(400).json({ error: 'Image is required' })
      }

      // Convertir l'image base64 en buffer
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
      imageBuffer = Buffer.from(base64Data, 'base64')

      const mimeType = image.match(/data:image\/(\w+);base64/)?.[1] || 'jpeg'
      contentType_image = `image/${mimeType}`
      date = dateParam
      location = locationParam
      alt = altParam
    }

    // Vérifier qu'on a bien une image
    if (!imageBuffer) {
      return res.status(400).json({ 
        error: 'Aucune image trouvée. Vérifie que tu envoies bien un fichier avec le champ "image" en FormData, ou une image en base64 dans le body JSON.' 
      })
    }

    // Vérifier la taille de l'image
    if (imageBuffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({
        error: `Image trop grande (${Math.round(imageBuffer.length / 1024 / 1024 * 100) / 100} MB). Maximum: 10 MB.`,
      })
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const extension = contentType_image.includes('jpeg') || contentType_image.includes('jpg')
      ? 'jpg'
      : contentType_image.includes('png')
      ? 'png'
      : 'jpg'
    const fileName = `${timestamp}-${randomId}.${extension}`
    const blobPath = `${PHOTOS_FOLDER}/${fileName}`

    // Uploader l'image dans Vercel Blob Storage
    const blob = await put(blobPath, imageBuffer, {
      access: 'public',
      contentType: contentType_image,
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
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Fichier trop volumineux' })
    }
    return res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' })
  }
}
