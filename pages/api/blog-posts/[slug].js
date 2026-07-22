// API route pour récupérer un article complet depuis Blob Storage avec fallback Notion

import { head } from '@vercel/blob'
import { getPostBySlug, getPostBlocks } from '../../../lib/notion'
import { captureDataError } from '../../../lib/sentry'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug) {
    return res.status(400).json({ error: 'Slug requis' })
  }

  try {
    try {
      const blob = await head(`blog-posts/${slug}.json`)
      if (blob) {
        const response = await fetch(blob.url, { next: { revalidate: 300 } })

        if (response.ok) {
          const article = await response.json()
          return res.status(200).json(article)
        }
      }
    } catch (blobError) {
      if (blobError.name !== 'BlobNotFoundError') {
        captureDataError(blobError, { source: 'blob', tags: { area: 'blog-api', slug } })
        console.warn(`⚠️ Erreur Blob pour ${slug}, fallback Notion:`, blobError.message)
      }
    }

    const post = await getPostBySlug(slug)
    if (!post) {
      return res.status(404).json({ error: 'Article non trouvé' })
    }

    const blocks = await getPostBlocks(post.id)
    const article = {
      ...post,
      blocks,
    }

    res.status(200).json(article)
  } catch (error) {
    captureDataError(error, { source: 'notion', tags: { area: 'blog-api', slug } })
    console.error(`Erreur API blog-posts/[slug] pour ${slug}:`, error)
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' })
  }
}
