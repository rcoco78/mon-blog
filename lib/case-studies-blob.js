// Helper pour charger les case studies depuis Blob Storage avec fallback vers fichier local
// Architecture split : index (~300 KB) + case-studies/[slug].json (~100 KB chacun)
// Réduit le Blob Data Transfer de ~4.5 MB à ~100-300 KB par requête

import { list, head } from '@vercel/blob'
import {
  caseStudies as localCaseStudies,
  getCaseStudyBySlug as getCaseStudyBySlugLocal,
  getCaseStudiesBySector as getCaseStudiesBySectorLocal,
} from './case-studies'

const BLOB_FILENAME = 'case-studies.json'
const BLOB_INDEX = 'case-studies-index.json'
const BLOB_SLUG_PREFIX = 'case-studies/'
let cachedIndex = null
let fetchIndexPromise = null

function getFallbackData() {
  return localCaseStudies.map((cs) => ({
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

// Charger l'index (léger) — utilisé pour listings, sector, home, sitemap
async function getCaseStudiesIndexFromBlob() {
  if (fetchIndexPromise) return fetchIndexPromise
  fetchIndexPromise = (async () => {
    try {
      const blobs = await list({ prefix: BLOB_INDEX })
      const blob = blobs.blobs.find((b) => b.pathname === BLOB_INDEX)
      if (!blob) throw new Error('Index introuvable')
      const res = await fetch(blob.url, { next: { revalidate: 300 } })
      if (!res.ok) throw new Error(`Index fetch ${res.status}`)
      const data = await res.json()
      if (!data?.caseStudies?.length) throw new Error('Index vide')
      cachedIndex = data.caseStudies
      return data.caseStudies
    } catch (e) {
      fetchIndexPromise = null
      throw e
    }
  })()
  const out = await fetchIndexPromise
  fetchIndexPromise = null
  return out
}

// Fallback : charger le full blob (ancien format)
async function getCaseStudiesFullFromBlob() {
  const blobs = await list({ prefix: BLOB_FILENAME })
  const blob = blobs.blobs.find((b) => b.pathname === BLOB_FILENAME)
  if (!blob) throw new Error('Blob case-studies.json introuvable')
  const res = await fetch(blob.url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Blob fetch ${res.status}`)
  const data = await res.json()
  if (!data?.caseStudies?.length) throw new Error('Blob vide')
  return data.caseStudies
}

// Charger les case studies (index ou full selon dispo) — pour listings
export async function getCaseStudiesFromBlob() {
  try {
    const blobs = await list({ prefix: BLOB_INDEX })
    if (blobs.blobs.some((b) => b.pathname === BLOB_INDEX)) {
      return await getCaseStudiesIndexFromBlob()
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[case-studies-blob] Index KO, fallback full:', e.message)
    }
  }
  try {
    return await getCaseStudiesFullFromBlob()
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[case-studies-blob] Blob KO, fallback local:', e.message)
    }
  }
  return getFallbackData()
}

// Récupérer UN cas par slug — fetch case-studies/[slug].json uniquement (~100 KB vs 4.5 MB)
export async function getCaseStudyBySlug(slug) {
  if (!slug) return null
  const path = `${BLOB_SLUG_PREFIX}${slug}.json`
  try {
    const blob = await head(path)
    if (blob) {
      const res = await fetch(blob.url, { next: { revalidate: 300 } })
      if (res.ok) return await res.json()
    }
  } catch {
    // head échoue si fichier absent (cas généré pas encore sync, ou slug invalide)
  }
  try {
    const full = await getCaseStudiesFullFromBlob()
    return full.find((cs) => cs.slug === slug) || null
  } catch {
    return getCaseStudyBySlugLocal(slug)
  }
}

export async function getCaseStudiesBySector(sector) {
  const caseStudies = await getCaseStudiesFromBlob()
  return caseStudies.filter((cs) => cs.sector === sector)
}

export async function getAllSectors() {
  const caseStudies = await getCaseStudiesFromBlob()
  return [...new Set(caseStudies.map((cs) => cs.sector))]
}

export async function getRelatedCaseStudies(slug, limit = 4) {
  const caseStudy = await getCaseStudyBySlug(slug)
  if (!caseStudy) return []
  const caseStudies = await getCaseStudiesFromBlob()
  const sameSector = caseStudies.filter(
    (cs) => cs.sector === caseStudy.sector && cs.slug !== slug
  )
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

