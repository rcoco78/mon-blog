// API route pour récupérer la liste des case studies depuis Blob Storage avec fallback local

import { list } from '@vercel/blob'
import { caseStudies } from '../../lib/case-studies'

const BLOB_FILENAME = 'case-studies.json'

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
        const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

        if (response.ok) {
          const data = await response.json()
          if (data.caseStudies && Array.isArray(data.caseStudies)) {
            console.log(
              `✅ Case studies récupérés depuis Blob Storage (${data.caseStudies.length} case studies, mis à jour: ${data.lastUpdated})`
            )
            return res.status(200).json(data.caseStudies)
          }
        }
      }
    } catch (blobError) {
      console.warn('⚠️ Erreur lors de la récupération depuis Blob Storage, fallback vers fichier local:', blobError.message)
    }

    // 2. Fallback vers fichier local si Blob Storage n'est pas disponible
    console.log('🔄 Récupération des case studies depuis fichier local (fallback)')
    const caseStudiesData = caseStudies.map(cs => ({
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
    res.status(200).json(caseStudiesData)
  } catch (error) {
    console.error('Erreur API case-studies:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des case studies' })
  }
}

