// API route pour récupérer un article complet depuis Blob Storage avec fallback Notion

import { head, list } from '@vercel/blob'
import { getPostBySlug, getPostBlocks } from '../../../lib/notion'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug) {
    return res.status(400).json({ error: 'Slug requis' })
  }

  try {
    // 1. Essayer de récupérer depuis Blob Storage
    try {
      const blob = await head(`blog-posts/${slug}.json`)
      if (blob) {
        const response = await fetch(blob.url, { next: { revalidate: 300 } })

        if (response.ok) {
          const article = await response.json()
          console.log(`✅ Article récupéré depuis Blob Storage: ${slug}`)
          return res.status(200).json(article)
        }
      }
    } catch (blobError) {
      // BlobNotFoundError est normal si les cron jobs n'ont pas encore tourné
      // Ne logger que les autres erreurs
      if (blobError.name !== 'BlobNotFoundError') {
        console.warn(`⚠️ Erreur lors de la récupération depuis Blob Storage pour ${slug}, fallback vers Notion:`, blobError.message)
      }
    }

    // 2. Fallback vers Notion
    console.log(`🔄 Récupération de l'article depuis Notion (fallback): ${slug}`)
    const post = await getPostBySlug(slug)
    if (!post) {
      return res.status(404).json({ error: 'Article non trouvé' })
    }

    const blocks = await getPostBlocks(post.id)
    const article = {
      ...post,
      blocks,
      // Pas de contentMarkdown en fallback, on utilisera les blocks
    }

    res.status(200).json(article)
  } catch (error) {
    console.error(`Erreur API blog-posts/[slug] pour ${slug}:`, error)
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' })
  }
}

