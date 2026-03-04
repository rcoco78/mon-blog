// API route pour récupérer un case study spécifique depuis Blob Storage avec fallback local

import { list } from '@vercel/blob'
import { getCaseStudyBySlug } from '../../../lib/case-studies'

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
      const blobs = await list({ prefix: 'case-studies.json' })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === 'case-studies.json')

      if (existingBlob) {
        const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

        if (response.ok) {
          const data = await response.json()
          if (data.caseStudies && Array.isArray(data.caseStudies)) {
            const caseStudy = data.caseStudies.find(cs => cs.slug === slug)
            if (caseStudy) {
              console.log(`✅ Case study récupéré depuis Blob Storage: ${slug}`)
              return res.status(200).json(caseStudy)
            }
          }
        }
      }
    } catch (blobError) {
      // BlobNotFoundError est normal si les cron jobs n'ont pas encore tourné
      if (blobError.name !== 'BlobNotFoundError') {
        console.warn(`⚠️ Erreur lors de la récupération depuis Blob Storage pour ${slug}, fallback vers fichier local:`, blobError.message)
      }
    }

    // 2. Fallback vers fichier local
    console.log(`🔄 Récupération du case study depuis fichier local (fallback): ${slug}`)
    const caseStudy = getCaseStudyBySlug(slug)
    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study non trouvé' })
    }

    const caseStudyData = {
      slug: caseStudy.slug,
      sector: caseStudy.sector,
      title: caseStudy.title,
      description: caseStudy.description,
      useCase: caseStudy.useCase,
      dataExtracted: caseStudy.dataExtracted,
      benefits: caseStudy.benefits,
      examples: caseStudy.examples,
      keywords: caseStudy.keywords,
    }

    res.status(200).json(caseStudyData)
  } catch (error) {
    console.error('Erreur API case-studies/[slug]:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération du case study' })
  }
}

