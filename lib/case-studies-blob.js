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
// Single-flight : une seule requête Blob à la fois, tous les appels concurrents partagent le résultat
let fetchPromise = null

function getFallbackData() {
  return localCaseStudies.map(cs => ({
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
}

// Charger les case studies depuis Blob Storage avec fallback
export async function getCaseStudiesFromBlob() {
  if (fetchPromise) {
    try {
      return await fetchPromise
    } catch (e) {
      fetchPromise = null
      return getFallbackData()
    }
  }

  fetchPromise = (async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout Blob Storage')), 8000)
      )

      const blobPromise = (async () => {
        const blobs = await list({ prefix: BLOB_FILENAME })
        const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

        if (!existingBlob) {
          throw new Error('Blob case-studies.json introuvable')
        }

        const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

        if (!response.ok) {
          throw new Error(`Blob fetch ${response.status}`)
        }

        const data = await response.json()
        if (!data?.caseStudies || !Array.isArray(data.caseStudies)) {
          throw new Error('Blob : structure invalide')
        }
        if (data.caseStudies.length === 0) {
          throw new Error('Blob : caseStudies vide')
        }

        cachedCaseStudies = data.caseStudies
        return data.caseStudies
      })()

      return await Promise.race([blobPromise, timeoutPromise])
    } catch (error) {
      if (error.message !== 'Timeout Blob Storage') {
        console.warn('⚠️ Blob Storage, fallback local:', error.message)
      }
      throw error
    } finally {
      fetchPromise = null
    }
  })()

  try {
    return await fetchPromise
  } catch (error) {
    fetchPromise = null
  }
  const fallbackData = getFallbackData()
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

