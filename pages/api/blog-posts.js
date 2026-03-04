// API route pour récupérer la liste des articles depuis Blob Storage avec fallback Notion

import { list } from '@vercel/blob'
import { getAllPosts } from '../../lib/notion'

const BLOB_FILENAME = 'blog-posts.json'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. Essayer de récupérer depuis Blob Storage (cache)
    try {
      const blobs = await list({ prefix: BLOB_FILENAME })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

      if (existingBlob) {
        // Cache-busting pour éviter les problèmes de cache
        const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

        if (response.ok) {
          const data = await response.json()
          if (data.posts && Array.isArray(data.posts)) {
            console.log(
              `✅ Articles récupérés depuis Blob Storage (${data.posts.length} articles, mis à jour: ${data.lastUpdated})`
            )
            return res.status(200).json(data.posts)
          }
        }
      }
    } catch (blobError) {
      console.warn('⚠️ Erreur lors de la récupération depuis Blob Storage, fallback vers Notion:', blobError.message)
    }

    // 2. Fallback vers Notion si Blob Storage n'est pas disponible
    console.log('🔄 Récupération des articles depuis Notion (fallback)')
    const posts = await getAllPosts()
    res.status(200).json(posts)
  } catch (error) {
    console.error('Erreur API blog-posts:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des articles' })
  }
}

