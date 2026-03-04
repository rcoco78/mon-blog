/**
 * API route pour récupérer les données de démo Apify depuis Blob Storage
 */

import { list } from '@vercel/blob'

const BLOB_FILENAME = 'apify-demo-data.json'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { actorSlug } = req.query

  if (!actorSlug) {
    return res.status(400).json({ error: 'actorSlug requis' })
  }

  try {
    // Récupérer depuis Blob Storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blobs = await list({ prefix: BLOB_FILENAME })
        const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

        if (existingBlob) {
          const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

          if (response.ok) {
            const data = await response.json()
            const actorData = data[actorSlug]
            
            if (actorData && actorData.items) {
              return res.status(200).json({
                items: actorData.items,
                input: actorData.input,
                generatedAt: actorData.generatedAt
              })
            }
          }
        }
      } catch (blobError) {
        if (blobError.name !== 'BlobNotFoundError') {
          console.warn('⚠️ Erreur lors de la récupération depuis Blob Storage:', blobError.message)
        }
      }
    }

    // Pas de données trouvées
    return res.status(404).json({ error: 'Données de démo non trouvées pour cet acteur' })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return res.status(500).json({
      error: 'Erreur lors de la récupération des données de démo',
      message: error.message
    })
  }
}
