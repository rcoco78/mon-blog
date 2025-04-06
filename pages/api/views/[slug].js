import { getPageViews } from '../../../lib/analytics'

export default async function handler(req, res) {
  const { slug } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' })
  }

  try {
    // Nettoyer le slug en supprimant tous les slashes
    const cleanSlug = slug.replace(/\//g, '')
    console.log('=== Début de la requête API ===')
    console.log('Slug reçu:', slug)
    console.log('Slug nettoyé:', cleanSlug)
    console.log('URL complète:', req.url)
    
    const views = await getPageViews(cleanSlug)
    res.status(200).json({ views })
  } catch (error) {
    console.error('Error fetching views:', error)
    res.status(500).json({ error: 'Error fetching views' })
  }
} 