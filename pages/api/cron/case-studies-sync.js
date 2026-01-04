// Cron job pour synchroniser les case studies vers Blob Storage
// Exécuté périodiquement pour garder les données à jour

import { put } from '@vercel/blob'
import { caseStudies } from '../../../lib/case-studies'

const BLOB_FILENAME = 'case-studies.json'

async function fetchAndSaveCaseStudies() {
  // Les case studies sont déjà dans le fichier local
  // On les sauvegarde simplement dans Blob Storage
  
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

  // Sauvegarder dans Blob Storage
  await put(
    BLOB_FILENAME,
    JSON.stringify(
      {
        caseStudies: caseStudiesData,
        lastUpdated: new Date().toISOString(),
        count: caseStudiesData.length,
      },
      null,
      2
    ),
    { access: 'public', allowOverwrite: true }
  )

  console.log(`[case-studies-sync] Case studies sauvegardés. Nombre : ${caseStudiesData.length}`)
  return caseStudiesData.length
}

export default async function handler(req, res) {
  // Sécurité : vérifier le secret si configuré
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const count = await fetchAndSaveCaseStudies()
    res.status(200).json({ ok: true, count, lastUpdated: new Date().toISOString() })
  } catch (error) {
    console.error('[case-studies-sync] Erreur:', error)
    res.status(500).json({ error: error.message })
  }
}

