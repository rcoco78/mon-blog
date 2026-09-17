// Cron job pour synchroniser les cas d'usage édités dans le dépôt vers Blob Storage.
// Le Blob est remplacé par cette source maîtrisée afin de ne pas conserver d'anciennes
// pages créées automatiquement.

import { putCaseStudiesSplit } from '../../../lib/case-studies-blob-write'
import { caseStudies } from '../../../lib/case-studies'

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

  await putCaseStudiesSplit(caseStudiesFromFile, { skipFull: false })

  console.log(`[case-studies-sync] Cas d'usage sauvegardés. Total : ${caseStudiesFromFile.length}, Personnalisés : ${personalizedInData}`)
  return { 
    count: caseStudiesFromFile.length,
    baseCount: caseStudiesFromFile.length,
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

