// API route pour récupérer la liste des case studies (utilise index blob ~300 KB)
import { getCaseStudiesFromBlob } from '../../lib/case-studies-blob'
import { caseStudies } from '../../lib/case-studies'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const caseStudiesData = await getCaseStudiesFromBlob()
    if (caseStudiesData?.length > 0) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      return res.status(200).json(caseStudiesData)
    }
  } catch (blobError) {
    console.warn('⚠️ Blob KO, fallback local:', blobError.message)
  }

  try {
    const caseStudiesData = caseStudies.map((cs) => ({
    slug: cs.slug,
    sector: cs.sector,
    title: cs.title,
    description: cs.description,
    useCase: cs.useCase,
    dataExtracted: cs.dataExtracted,
    benefits: cs.benefits,
    examples: cs.examples,
    keywords: cs.keywords,
  }))
    return res.status(200).json(caseStudiesData)
  } catch (error) {
    console.error('Erreur API case-studies:', error)
    return res.status(500).json({ error: 'Erreur lors de la récupération des case studies' })
  }
}

