// Cron job pour synchroniser les case studies vers Blob Storage
// Inclut les données de base ET les données personnalisées
// IMPORTANT : fusionne avec les cas générés par generate-new-case-studies (ne les écrase pas)

import { list, put } from '@vercel/blob'
import { caseStudies } from '../../../lib/case-studies'

const BLOB_FILENAME = 'case-studies.json'

async function loadExistingBlob() {
  try {
    const blobs = await list({ prefix: BLOB_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === BLOB_FILENAME)
    if (!blob) return null
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data?.caseStudies && Array.isArray(data.caseStudies) ? data : null
  } catch (e) {
    console.warn('[case-studies-sync] Erreur chargement blob existant:', e.message)
    return null
  }
}

async function fetchAndSaveCaseStudies() {
  // Charger les données personnalisées
  let personalizedData = {}
  let personalizedCount = 0
  try {
    const personalizedModule = await import('../../../lib/case-studies-personalized')
    personalizedData = personalizedModule.personalizedCaseStudies || {}
    personalizedCount = Object.keys(personalizedData).length
    console.log(`[case-studies-sync] Données personnalisées chargées: ${personalizedCount} entrées`)
  } catch (error) {
    console.warn('[case-studies-sync] Erreur lors du chargement des données personnalisées:', error.message)
  }

  const baseSlugs = new Set(caseStudies.map((cs) => cs.slug))

  // Fusionner les données de base avec les données personnalisées
  let personalizedInData = 0
  const caseStudiesFromFile = caseStudies.map((cs) => {
    const baseData = {
      slug: cs.slug,
      sector: cs.sector,
      title: cs.title,
      description: cs.description,
      useCase: cs.useCase,
      dataExtracted: cs.dataExtracted,
      benefits: cs.benefits,
      examples: cs.examples,
      keywords: cs.keywords,
    }

    if (personalizedData[cs.slug]) {
      baseData.personalized = personalizedData[cs.slug]
      personalizedInData++
    }

    return baseData
  })

  // Charger le blob actuel et garder les cas générés par generate-new-case-studies
  const existingBlob = await loadExistingBlob()
  let generatedCases = []
  if (existingBlob?.caseStudies) {
    generatedCases = existingBlob.caseStudies.filter((cs) => cs?.slug && !baseSlugs.has(cs.slug))
    if (generatedCases.length > 0) {
      console.log(`[case-studies-sync] Conservation de ${generatedCases.length} cas générés dynamiquement`)
    }
  }

  const caseStudiesData = [...caseStudiesFromFile, ...generatedCases]

  await put(
    BLOB_FILENAME,
    JSON.stringify(
      {
        caseStudies: caseStudiesData,
        personalizedCount: personalizedInData,
        personalizedAvailable: personalizedCount,
        lastUpdated: new Date().toISOString(),
        count: caseStudiesData.length,
      },
      null,
      2
    ),
    { access: 'public', allowOverwrite: true }
  )

  console.log(`[case-studies-sync] Case studies sauvegardés. Base : ${caseStudiesFromFile.length}, Générés : ${generatedCases.length}, Total : ${caseStudiesData.length}, Personnalisés : ${personalizedInData}`)
  return { 
    count: caseStudiesData.length,
    baseCount: caseStudiesFromFile.length,
    generatedCount: generatedCases.length,
    personalizedCount: personalizedInData,
    personalizedAvailable: personalizedCount
  }
}

export default async function handler(req, res) {
  // Sécurité : vérifier le secret si configuré
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await fetchAndSaveCaseStudies()
    res.status(200).json({ ok: true, ...result, lastUpdated: new Date().toISOString() })
  } catch (error) {
    console.error('[case-studies-sync] Erreur:', error)
    res.status(500).json({ error: error.message })
  }
}

