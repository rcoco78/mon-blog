// Cron job pour synchroniser les case studies vers Blob Storage
// Inclut les données de base ET les données personnalisées
// Exécuté périodiquement pour garder les données à jour

import { put } from '@vercel/blob'
import { caseStudies } from '../../../lib/case-studies'

const BLOB_FILENAME = 'case-studies.json'

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
  const caseStudiesData = caseStudies.map(cs => {
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
    
    // Ajouter les données personnalisées si disponibles
    if (personalizedData[cs.slug]) {
      baseData.personalized = personalizedData[cs.slug]
      personalizedInData++
    }
    
    return baseData
  })

  // Sauvegarder dans Blob Storage
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

  console.log(`[case-studies-sync] Case studies sauvegardés. Nombre : ${caseStudiesData.length}, Personnalisés dans Blob : ${personalizedInData}, Disponibles : ${personalizedCount}`)
  return { 
    count: caseStudiesData.length, 
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

