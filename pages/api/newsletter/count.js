import { list } from '@vercel/blob'

const BLOB_FILENAME = 'newsletter-subscribers.json'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Récupérer le nombre d'inscrits depuis Blob Storage
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

    if (existingBlob) {
      const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

      if (response.ok) {
        const data = await response.json()
        const count = data.subscribers ? data.subscribers.length : 0
        return res.status(200).json({ count })
      }
    }

    // Si pas de fichier, retourner 0
    res.status(200).json({ count: 0 })
  } catch (error) {
    console.error('Error fetching subscriber count:', error)
    res.status(500).json({ message: 'Error fetching subscriber count', count: 0 })
  }
} 