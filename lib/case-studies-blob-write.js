/**
 * Helper pour écrire case-studies en format split : index (léger) + 1 fichier par slug.
 * Réduit le Blob Data Transfer de ~123 GB à ~5-10 GB (index ~300 KB au lieu de 4.5 MB par requête).
 */
import { put } from '@vercel/blob'

const BLOB_FILENAME = 'case-studies.json'
const BLOB_INDEX = 'case-studies-index.json'
const BLOB_SLUG_PREFIX = 'case-studies/'

// Champs exclus de l'index (réduit la taille, chargés à la demande via [slug].json)
const INDEX_OMIT = ['useCase', 'personalized']

function toIndexEntry(cs) {
  if (!cs || !cs.slug) return null
  const entry = { ...cs }
  for (const key of INDEX_OMIT) delete entry[key]
  return entry
}

/**
 * Écrit case-studies en 3 formats :
 * - case-studies.json (full, pour crons ctr-analysis, ranking-check)
 * - case-studies-index.json (léger, pour listings/sector/home)
 * - case-studies/[slug].json (full par cas, pour page détail)
 *
 * @param {object} options.onlyNewSlugs - si fourni, n'écrit que les slugs listés (optimisation generate-new-case-studies)
 */
export async function putCaseStudiesSplit(caseStudies, options = {}) {
  if (!Array.isArray(caseStudies) || caseStudies.length === 0) return

  const { skipFull = false, onlyNewSlugs } = options
  const now = new Date().toISOString()

  // 1. Index (metadata sans useCase/personalized)
  const indexData = {
    caseStudies: caseStudies.map(toIndexEntry).filter(Boolean),
    lastUpdated: now,
    count: caseStudies.length,
  }
  await put(BLOB_INDEX, JSON.stringify(indexData, null, 2), {
    access: 'public',
    allowOverwrite: true,
  })

  // 2. Un fichier par slug (full) — si onlyNewSlugs, uniquement les nouveaux (évite timeout avec 500+ cas)
  const slugsToWrite = Array.isArray(onlyNewSlugs) && onlyNewSlugs.length > 0
    ? new Set(onlyNewSlugs)
    : null
  const casesToWrite = slugsToWrite
    ? caseStudies.filter((cs) => cs?.slug && slugsToWrite.has(cs.slug))
    : caseStudies

  // Parallélisation par lots de 10 pour accélérer sans surcharger l'API Blob
  const BATCH_SIZE = 10
  for (let i = 0; i < casesToWrite.length; i += BATCH_SIZE) {
    const batch = casesToWrite.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map((cs) =>
        put(`${BLOB_SLUG_PREFIX}${cs.slug}.json`, JSON.stringify(cs, null, 2), {
          access: 'public',
          allowOverwrite: true,
        })
      )
    )
  }

  // 3. Full (pour crons) sauf si skipFull
  if (!skipFull) {
    await put(
      BLOB_FILENAME,
      JSON.stringify(
        {
          caseStudies,
          lastUpdated: now,
          count: caseStudies.length,
        },
        null,
        2
      ),
      { access: 'public', allowOverwrite: true }
    )
  }
}

