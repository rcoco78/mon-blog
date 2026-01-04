// Helper pour charger les case studies depuis Blob Storage avec fallback vers fichier local
// Utilisé dans getStaticProps pour charger les données depuis Blob Storage

import { list } from '@vercel/blob'
import { 
  caseStudies as localCaseStudies, 
  getAllSectors as getAllSectorsLocal,
  getCaseStudyBySlug as getCaseStudyBySlugLocal,
  getCaseStudiesBySector as getCaseStudiesBySectorLocal,
  getRelatedCaseStudies as getRelatedCaseStudiesLocal
} from './case-studies'

const BLOB_FILENAME = 'case-studies.json'
let cachedCaseStudies = null

// Charger les case studies depuis Blob Storage avec fallback
export async function getCaseStudiesFromBlob() {
  // Utiliser le cache si disponible
  if (cachedCaseStudies) {
    return cachedCaseStudies
  }

  // Essayer Blob Storage avec timeout pour éviter de bloquer trop longtemps
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout Blob Storage')), 3000)
    )
    
    const blobPromise = (async () => {
      const blobs = await list({ prefix: BLOB_FILENAME })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

      if (existingBlob) {
        const response = await fetch(existingBlob.url, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.caseStudies && Array.isArray(data.caseStudies) && data.caseStudies.length > 0) {
            cachedCaseStudies = data.caseStudies
            return data.caseStudies
          }
        }
      }
      throw new Error('Blob Storage vide ou invalide')
    })()
    
    return await Promise.race([blobPromise, timeoutPromise])
  } catch (error) {
    // Silencieux en cas de timeout ou d'erreur - on utilise le fallback
    if (error.message !== 'Timeout Blob Storage') {
      console.warn('⚠️ Erreur lors de la récupération depuis Blob Storage, fallback vers fichier local:', error.message)
    }
  }

  // Fallback vers fichier local (toujours disponible)
  const fallbackData = localCaseStudies.map(cs => ({
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
  cachedCaseStudies = fallbackData
  return fallbackData
}

// Wrapper pour getCaseStudyBySlug qui utilise Blob Storage
export async function getCaseStudyBySlug(slug) {
  const caseStudies = await getCaseStudiesFromBlob()
  return caseStudies.find(cs => cs.slug === slug) || null
}

// Wrapper pour getCaseStudiesBySector qui utilise Blob Storage
export async function getCaseStudiesBySector(sector) {
  const caseStudies = await getCaseStudiesFromBlob()
  return caseStudies.filter(cs => cs.sector === sector)
}

// Wrapper pour getAllSectors qui utilise Blob Storage
export async function getAllSectors() {
  const caseStudies = await getCaseStudiesFromBlob()
  return [...new Set(caseStudies.map(cs => cs.sector))]
}

// Wrapper pour getRelatedCaseStudies qui utilise Blob Storage
export async function getRelatedCaseStudies(slug, limit = 4) {
  const caseStudy = await getCaseStudyBySlug(slug)
  if (!caseStudy) return []
  
  const caseStudies = await getCaseStudiesFromBlob()
  const sameSector = caseStudies.filter(cs => cs.sector === caseStudy.sector && cs.slug !== slug)
  return sameSector.slice(0, limit)
}

// Helper pour récupérer les données personnalisées depuis Blob Storage
export async function getPersonalizedData(slug) {
  try {
    const caseStudy = await getCaseStudyBySlug(slug)
    return caseStudy?.personalized || null
  } catch (error) {
    console.warn('⚠️ Erreur lors de la récupération des données personnalisées:', error.message)
    return null
  }
}

