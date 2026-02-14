// API paginée pour les bases marketplace par catégorie
import { list } from '@vercel/blob'
import { getDatabasesByCategory, getDatabasesAsTools } from '../../../../lib/marketplace-databases'
import { slugToCategory, categoryToSlug } from '../../../../lib/marketplace-helpers'

const MAX_DESCRIPTION_LENGTH = 120
const VIEWS_EVENTS_FILENAME = 'marketplace-views-events.json'

async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === VIEWS_EVENTS_FILENAME)
    if (blob) {
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data : []
      }
    }
    return []
  } catch {
    return []
  }
}

function optimizeDatabase(db, toolsBySlug, categorySlug, views = 0) {
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
    views: views || 0,
  }
}

function matchesPriceFilter(db, priceFilter) {
  if (!priceFilter || priceFilter === 'all') return true
  const p = db.price || 0
  if (priceFilter === 'lt100') return db.isPaid && p >= 1 && p < 100
  if (priceFilter === '100-200') return db.isPaid && p >= 100 && p <= 200
  if (priceFilter === '200plus') return db.isPaid && p > 200
  return true
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { category: categorySlug, offset: offsetParam, limit: limitParam, search: searchQuery, sort: sortParam, price: priceFilterParam } = req.query
  const offset = parseInt(offsetParam, 10) || 0
  const limit = Math.min(parseInt(limitParam, 10) || 60, 100)
  const sort = ['price_desc', 'views', 'date'].includes(sortParam) ? sortParam : 'date'
  const priceFilter = ['lt100', '100-200', '200plus', 'all'].includes(priceFilterParam) ? priceFilterParam : 'all'

  if (!categorySlug) {
    return res.status(400).json({ error: 'Category slug required' })
  }

  const category = slugToCategory(categorySlug)
  if (!category) {
    return res.status(404).json({ error: 'Category not found' })
  }

  try {
    const [databases, tools, events] = await Promise.all([
      getDatabasesByCategory(category),
      getDatabasesAsTools(),
      getViewEvents(),
    ])

    const viewsMap = {}
    events.forEach((e) => {
      if (e.slug && e.category === category) {
        const k = `${e.category}/${e.slug}`
        viewsMap[k] = (viewsMap[k] || 0) + 1
      }
    })

    const toolsBySlug = Object.fromEntries((tools || []).map(t => [t.slug, t]))
    const slug = categoryToSlug(category) || 'autres'

    const withLinks = databases.map(db => {
      const tool = toolsBySlug[db.slug]
      return {
        ...db,
        description: tool?.description || db.description || db.shortDescription || '',
        views: viewsMap[`${category}/${db.slug}`] || 0,
      }
    })

    let filtered = withLinks
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(db =>
        (db.name || '').toLowerCase().includes(q) ||
        (db.description || '').toLowerCase().includes(q) ||
        (db.category || '').toLowerCase().includes(q)
      )
    }
    filtered = filtered.filter(db => matchesPriceFilter(db, priceFilter))

    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'price_desc') {
        const pa = a.isPaid ? (a.price || 0) : 0
        const pb = b.isPaid ? (b.price || 0) : 0
        return pb - pa
      }
      if (sort === 'views') {
        const va = a.views || 0
        const vb = b.views || 0
        if (vb !== va) return vb - va
      }
      const dateA = a.lastEnriched ? new Date(a.lastEnriched) : (a.date ? new Date(a.date) : new Date(0))
      const dateB = b.lastEnriched ? new Date(b.lastEnriched) : (b.date ? new Date(b.date) : new Date(0))
      return dateB - dateA
    })

    const total = sorted.length
    const paginated = sorted.slice(offset, offset + limit)
    const items = paginated.map(db => optimizeDatabase(db, toolsBySlug, slug, db.views))

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
