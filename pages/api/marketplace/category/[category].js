// API paginée pour les bases marketplace par catégorie
import { getDatabasesByCategory, getDatabasesAsTools } from '../../../../lib/marketplace-databases'
import { slugToCategory, categoryToSlug } from '../../../../lib/marketplace-helpers'

const MAX_DESCRIPTION_LENGTH = 120

function optimizeDatabase(db, toolsBySlug, categorySlug) {
  const tool = toolsBySlug[db.slug]
  const desc = tool?.description || db.description || db.shortDescription || ''
  return {
    slug: db.slug,
    name: db.name,
    description: (desc || '').slice(0, MAX_DESCRIPTION_LENGTH) + (desc?.length > MAX_DESCRIPTION_LENGTH ? '…' : ''),
    category: db.category,
    link: tool?.link || `/marketplace/${categorySlug}/${db.slug}`,
    isPaid: db.isPaid,
    price: db.price,
    lastEnriched: db.lastEnriched || null,
    date: db.date || null,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { category: categorySlug, offset: offsetParam, limit: limitParam, search: searchQuery } = req.query
  const offset = parseInt(offsetParam, 10) || 0
  const limit = Math.min(parseInt(limitParam, 10) || 60, 100)

  if (!categorySlug) {
    return res.status(400).json({ error: 'Category slug required' })
  }

  const category = slugToCategory(categorySlug)
  if (!category) {
    return res.status(404).json({ error: 'Category not found' })
  }

  try {
    const [databases, tools] = await Promise.all([
      getDatabasesByCategory(category),
      getDatabasesAsTools(),
    ])

    const toolsBySlug = Object.fromEntries((tools || []).map(t => [t.slug, t]))
    const slug = categoryToSlug(category) || 'autres'

    const withLinks = databases.map(db => {
      const tool = toolsBySlug[db.slug]
      return {
        ...db,
        description: tool?.description || db.description || db.shortDescription || '',
      }
    })

    let filtered = withLinks
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = withLinks.filter(db => {
        return (db.name || '').toLowerCase().includes(q) ||
          (db.description || '').toLowerCase().includes(q) ||
          (db.category || '').toLowerCase().includes(q)
      })
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.lastEnriched ? new Date(a.lastEnriched) : (a.date ? new Date(a.date) : new Date(0))
      const dateB = b.lastEnriched ? new Date(b.lastEnriched) : (b.date ? new Date(b.date) : new Date(0))
      return dateB - dateA
    })

    const total = sorted.length
    const paginated = sorted.slice(offset, offset + limit)
    const items = paginated.map(db => optimizeDatabase(db, toolsBySlug, slug))

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({
      items,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error('[api/marketplace/category] Error:', error.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
