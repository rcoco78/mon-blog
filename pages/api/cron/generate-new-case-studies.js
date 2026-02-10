// Cron Vercel pour générer automatiquement de nouveaux cas d'usage scraping
// Objectif : chaque appel ajoute quelques nouveaux case studies "intelligents"
// au blob `case-studies.json`, sans dupliquer les cas existants.
//
// À utiliser avec un Cron Vercel, par ex. 1x/jour.
//
// Variables d'environnement nécessaires :
// - CRON_SECRET           : token pour sécuriser l'endpoint (optionnel mais recommandé)
// - OPENAI_API_KEY        : clé OpenAI pour la génération
// - CASE_STUDIES_PER_RUN  : (optionnel) nombre de nouveaux cas à générer par exécution (défaut: 5)

import { list, put } from '@vercel/blob'
import { caseStudies as localCaseStudies } from '../../../lib/case-studies'

const BLOB_FILENAME = 'case-studies.json'

// Petit helper pour slugifier un titre
function slugify(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-') // tout en tirets
    .replace(/^-+|-+$/g, '')
}

// Charger le blob brut (objet complet { caseStudies, personalizedCount, ... })
async function loadBlobData() {
  try {
    const blobs = await list({ prefix: BLOB_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

    if (!existingBlob) {
      return null
    }

    const response = await fetch(existingBlob.url, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data || !Array.isArray(data.caseStudies)) {
      return null
    }

    return { data, blobUrl: existingBlob.url }
  } catch (error) {
    console.warn('[generate-new-case-studies] Erreur lors du chargement du blob:', error.message)
    return null
  }
}

// Fallback : reconstruire une structure de blob minimale depuis le fichier local
function buildBlobFromLocal() {
  const caseStudiesData = localCaseStudies.map((cs) => ({
    slug: cs.slug,
    sector: cs.sector,
    title: cs.title,
    description: cs.description,
    useCase: cs.useCase,
    dataExtracted: cs.dataExtracted,
    benefits: cs.benefits,
    examples: cs.examples,
    keywords: cs.keywords,
    personalized: cs.personalized || undefined,
  }))

  const personalizedCount = caseStudiesData.filter((cs) => !!cs.personalized).length

  return {
    caseStudies: caseStudiesData,
    personalizedCount,
    personalizedAvailable: personalizedCount,
    lastUpdated: new Date().toISOString(),
    count: caseStudiesData.length,
  }
}

// Construire un résumé compact de ce qui existe déjà pour le passer à l'IA
function buildKnowledgeSummary(existingCaseStudies, sampleSize = 40) {
  const randomSample = [...existingCaseStudies]
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize)

  // Stats par secteur
  const sectorCounts = {}
  const keywordCounts = {}
  const dataCounts = {}

  for (const cs of existingCaseStudies) {
    if (cs.sector) {
      sectorCounts[cs.sector] = (sectorCounts[cs.sector] || 0) + 1
    }
    ;(cs.keywords || []).forEach((k) => {
      const kk = k.toLowerCase()
      keywordCounts[kk] = (keywordCounts[kk] || 0) + 1
    })
    ;(cs.dataExtracted || []).forEach((d) => {
      const dd = d.toLowerCase()
      dataCounts[dd] = (dataCounts[dd] || 0) + 1
    })
  }

  const sortCounts = (obj, limit = 40) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }))

  return {
    totalCount: existingCaseStudies.length,
    sectors: sortCounts(sectorCounts, 100),
    topKeywords: sortCounts(keywordCounts, 60),
    topDataTypes: sortCounts(dataCounts, 60),
    examples: randomSample.map((cs) => ({
      slug: cs.slug,
      title: cs.title,
      sector: cs.sector,
      description: cs.description,
      dataExtracted: cs.dataExtracted,
      keywords: cs.keywords,
    })),
  }
}

// Appel OpenAI pour générer N nouveaux cas d'usage originaux, en se basant sur le blob existant
async function generateNewCaseStudies(existingCaseStudies, count) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquant')
  }

  const summary = buildKnowledgeSummary(existingCaseStudies)
  const titlesSet = new Set(
    existingCaseStudies
      .filter((cs) => cs.title)
      .map((cs) => cs.title.toLowerCase().trim()),
  )

  const systemPrompt =
    "Tu es un expert en scraping web, automatisation et SEO B2B. " +
    "Tu rédiges des cas d'usage concrets, orientés business, en français, " +
    "avec un ton professionnel mais accessible. Tu renvoies toujours du JSON strictement valide, sans texte autour et sans blocs ```."

  const userPrompt = `
Nous voulons créer ${count} nouveaux cas d'usage de scraping à partir de la base existante.

Voici un résumé de ce qui existe déjà :

1) Statistiques par secteur (secteurs couverts et volume de cas d'usage) :
${JSON.stringify(summary.sectors, null, 2)}

2) Types de données les plus extraites aujourd'hui :
${JSON.stringify(summary.topDataTypes, null, 2)}

3) Mots-clés SEO les plus fréquents :
${JSON.stringify(summary.topKeywords, null, 2)}

4) Quelques exemples de cas d'usage existants (style et structure) :
${JSON.stringify(summary.examples, null, 2)}

OBJECTIF :
- Proposer ${count} nouveaux cas d'usage de scraping ET automatisation qui complètent intelligemment cette base.
- Chercher en priorité :
  - Des combinaisons secteur / type de données / intention business encore peu couvertes.
  - Des angles originaux (nouvelles plateformes à scraper, nouvelles granularités, nouvelles applications business).
- Chaque cas d'usage doit être concret, actionnable et pensé pour générer des rendez-vous (prospects qui se disent "c'est exactement mon problème").

CONTRAINTES IMPORTANTES (très important) :
1. Aucun titre ne doit être une copie ou une légère variante des titres existants.
2. Chaque nouveau cas doit être clairement différencié des exemples fournis (autre angle, autre combinatoire de données / secteur / objectif).
3. On doit comprendre précisément :
   - quelles données sont scrapées,
   - sur quels types de sites / plateformes,
   - et comment ces données sont utilisées dans le business.
4. Style : marketing B2B, orienté ROI, comme les exemples.

FORMAT DE RÉPONSE ATTENDU :
- Tu dois répondre par un UNIQUE JSON avec la structure EXACTE suivante :
{
  "cases": [
    {
      "slug": "slug-url-friendly-base-sur-le-titre-et-langle",
      "sector": "Nom du secteur clair (ex: Restauration, Immobilier, Recrutement & RH, ...)",
      "title": "Titre marketing clair et original",
      "description": "Résumé en 2-3 phrases qui donne envie de lire le détail.",
      "useCase": "Description détaillée (150-250 mots) expliquant concrètement le cas d'usage.",
      "dataExtracted": [
        "Type de donnée 1",
        "Type de donnée 2",
        "Type de donnée 3"
      ],
      "benefits": [
        "Bénéfice business 1",
        "Bénéfice business 2",
        "Bénéfice business 3"
      ],
      "examples": [
        "Source / site web 1",
        "Source / site web 2",
        "Source / site web 3"
      ],
      "keywords": [
        "mots clés SEO pertinents autour du scraping, du secteur et de l'intention"
      ]
    }
  ]
}

IMPORTANT :
- Le contenu doit être en français.
- Le JSON doit être strictement valide.
- Le tableau "cases" doit contenir exactement ${count} cas d'usage, tous différents entre eux.
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    let errorText = ''
    try {
      const err = await response.json()
      errorText = err.error?.message || JSON.stringify(err)
    } catch {
      errorText = await response.text()
    }
    throw new Error(`Erreur OpenAI: ${errorText}`)
  }

  const data = await response.json()
  let content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('Réponse OpenAI vide')
  }

  // Tentative simple de parsing JSON (on log en cas d'erreur)
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.error(
      '[generate-new-case-studies] Erreur de parsing JSON OpenAI:',
      e.message,
    )
    console.error(
      '[generate-new-case-studies] Contenu brut OpenAI (début):',
      content.slice(0, 500),
    )
    throw new Error(
      `Réponse OpenAI invalide (JSON non parsable): ${e.message}`,
    )
  }

  const cases = Array.isArray(parsed) ? parsed : parsed.cases
  if (!Array.isArray(cases)) {
    throw new Error('La réponse OpenAI doit être un tableau ou contenir une propriété "cases" tableau')
  }

  // On retourne le tableau brut, la normalisation / filtrage se fait ensuite
  return { generatedRaw: cases, existingTitlesSet: titlesSet }
}

// Validation minimale + harmonisation de la structure
function normalizeGeneratedCaseStudy(raw, existingSlugs) {
  if (!raw || !raw.title || !raw.description) {
    throw new Error('Cas généré invalide (titre/description manquants)')
  }

  let slug = raw.slug || slugify(raw.title)
  if (!slug) {
    slug = slugify(raw.title)
  }

  // Éviter les collisions de slugs (suffixes -2, -3, ...)
  const baseSlug = slug
  let counter = 2
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`
    counter += 1
  }

  // Normaliser quelques champs
  const sector = raw.sector || 'Autres'
  const dataExtracted = Array.isArray(raw.dataExtracted) ? raw.dataExtracted : []
  const benefits = Array.isArray(raw.benefits) ? raw.benefits : []
  const examples = Array.isArray(raw.examples) ? raw.examples : []
  const keywords = Array.isArray(raw.keywords) ? raw.keywords : []

  return {
    slug,
    sector,
    title: raw.title,
    description: raw.description,
    useCase: raw.useCase || '',
    dataExtracted,
    benefits,
    examples,
    keywords,
  }
}

export default async function handler(req, res) {
  // Méthode
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Sécurité : même mécanique que case-studies-sync
  if (process.env.CRON_SECRET) {
    const auth = req.headers.authorization
    if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY manquant côté serveur' })
  }

  const maxPerRun = Number(process.env.CASE_STUDIES_PER_RUN || 5)

  try {
    // 1) Charger le blob existant, ou reconstruire depuis local
    const blobResult = await loadBlobData()
    let blobData
    if (blobResult && blobResult.data) {
      blobData = blobResult.data
    } else {
      blobData = buildBlobFromLocal()
    }

    const existingCaseStudies = blobData.caseStudies || []
    const existingSlugs = new Set(existingCaseStudies.map((cs) => cs.slug))
    const existingTitles = new Set(
      existingCaseStudies
        .filter((cs) => cs.title)
        .map((cs) => cs.title.toLowerCase().trim()),
    )

    // 2) Demander à l'IA de proposer de nouveaux cas d'usage qui complètent la base
    const { generatedRaw } = await generateNewCaseStudies(existingCaseStudies, maxPerRun)

    const generated = []
    for (const raw of generatedRaw) {
      try {
        const titleNorm = (raw.title || '').toLowerCase().trim()
        if (!titleNorm) continue

        // Filtre simple anti-duplication sur le titre (par rapport au blob existant)
        if (existingTitles.has(titleNorm)) {
          continue
        }

        const normalized = normalizeGeneratedCaseStudy(raw, existingSlugs)

        existingCaseStudies.push(normalized)
        existingSlugs.add(normalized.slug)
        existingTitles.add(titleNorm)
        generated.push(normalized)
      } catch (error) {
        console.error('[generate-new-case-studies] Erreur de normalisation:', error.message)
      }
    }

    if (generated.length === 0) {
      return res.status(500).json({
        error: 'Aucun cas d\'usage généré avec succès',
      })
    }

    // 3) Mettre à jour le blob
    blobData.caseStudies = existingCaseStudies
    blobData.count = existingCaseStudies.length
    blobData.lastUpdated = new Date().toISOString()

    await put(
      BLOB_FILENAME,
      JSON.stringify(blobData, null, 2),
      { access: 'public', allowOverwrite: true },
    )

    console.log(
      `[generate-new-case-studies] ${generated.length} nouveaux cas d'usage ajoutés. Total: ${existingCaseStudies.length}`,
    )

    return res.status(200).json({
      ok: true,
      added: generated.length,
      total: existingCaseStudies.length,
      generated: generated.map((g) => ({
        slug: g.slug,
        title: g.title,
        sector: g.sector,
      })),
      lastUpdated: blobData.lastUpdated,
    })
  } catch (error) {
    console.error('[generate-new-case-studies] Erreur:', error)
    return res.status(500).json({ error: error.message || 'Erreur inconnue' })
  }
}

