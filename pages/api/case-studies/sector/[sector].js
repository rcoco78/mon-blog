// API paginée pour les case studies par secteur (réduit la taille des pages statiques)
import { getCaseStudiesBySector } from '../../../../lib/case-studies-blob'
import { getCaseStudiesBySector as getCaseStudiesBySectorLocal } from '../../../../lib/case-studies'
import { slugToSector } from '../../../../lib/case-studies-helpers'

const MAX_DESCRIPTION_LENGTH = 150
const MAX_EXAMPLES = 3
const MAX_KEYWORDS = 8

function optimizeCaseStudy(cs) {
  return {
    slug: cs.slug,
    title: cs.title,
    description: (cs.description || '').slice(0, MAX_DESCRIPTION_LENGTH) + (cs.description?.length > MAX_DESCRIPTION_LENGTH ? '…' : ''),
    sector: cs.sector,
    keywords: (cs.keywords || []).slice(0, MAX_KEYWORDS),
    examples: (cs.examples || []).slice(0, MAX_EXAMPLES),
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sector: sectorSlug, offset: offsetParam, limit: limitParam, search: searchQuery } = req.query
  const offset = parseInt(offsetParam, 10) || 0
  const limit = Math.min(parseInt(limitParam, 10) || 60, 100)

  if (!sectorSlug) {
    return res.status(400).json({ error: 'Sector slug required' })
  }

  const sector = slugToSector(sectorSlug)
  if (!sector) {
    return res.status(404).json({ error: 'Sector not found' })
  }

  try {
    let sectorCaseStudies = []
    try {
      sectorCaseStudies = await getCaseStudiesBySector(sector)
    } catch (error) {
      sectorCaseStudies = getCaseStudiesBySectorLocal(sector)
    }

    // Filtrage par recherche si fourni
    let filtered = sectorCaseStudies
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = sectorCaseStudies.filter(cs => {
        return (cs.title || '').toLowerCase().includes(q) ||
          (cs.description || '').toLowerCase().includes(q) ||
          (Array.isArray(cs.keywords) && cs.keywords.some(k => (k || '').toLowerCase().includes(q))) ||
          (Array.isArray(cs.examples) && cs.examples.some(e => (e || '').toLowerCase().includes(q)))
      })
    }

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)
    const items = paginated.map(optimizeCaseStudy)

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({
      items,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error('[api/case-studies/sector] Error:', error.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
