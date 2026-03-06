// API route pour récupérer un case study (fetch case-studies/[slug].json ~100 KB)
import { getCaseStudyBySlug } from '../../../lib/case-studies-blob'
import { getCaseStudyBySlug as getCaseStudyBySlugLocal } from '../../../lib/case-studies'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug) {
    return res.status(400).json({ error: 'Slug requis' })
  }

  try {
    const caseStudy = await getCaseStudyBySlug(slug)
    if (caseStudy) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      return res.status(200).json(caseStudy)
    }
    const caseStudyLocal = getCaseStudyBySlugLocal(slug)
    if (!caseStudyLocal) {
      return res.status(404).json({ error: 'Case study non trouvé' })
    }

    const caseStudyData = {
      slug: caseStudyLocal.slug,
      sector: caseStudyLocal.sector,
      title: caseStudyLocal.title,
      description: caseStudyLocal.description,
      useCase: caseStudyLocal.useCase,
      dataExtracted: caseStudyLocal.dataExtracted,
      benefits: caseStudyLocal.benefits,
      examples: caseStudyLocal.examples,
      keywords: caseStudyLocal.keywords,
    }

    res.status(200).json(caseStudyData)
  } catch (error) {
    console.error('Erreur API case-studies/[slug]:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération du case study' })
  }
}

