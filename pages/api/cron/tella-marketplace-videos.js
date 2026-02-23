/**
 * Cron Tella → Marketplace : synchronise les vidéos d'une playlist Tella
 * avec les bases de données marketplace.
 *
 * Stratégie : GPT-4o mini (comme generate-new-case-studies pour les use cases)
 * Score sémantique fiable car une vidéo est créée à chaque publication de base.
 * Fallback : scoring textuel si OPENAI_API_KEY absent.
 * Stocke le mapping dans Blob : marketplace-database-videos.json
 */

import { put } from '@vercel/blob'
import { listVideosByPlaylist } from '../../../lib/tella-api'
import { getAllDatabases } from '../../../lib/marketplace-databases'

const MAPPING_BLOB_KEY = 'marketplace-database-videos.json'

function slugify(s) {
  if (!s || typeof s !== 'string') return ''
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Synonymes : mot vidéo → mots équivalents (fallback textuel) */
const VIDEO_SYNONYMS = {
  cgp: ['gestion', 'patrimoine'],
  cgps: ['gestion', 'patrimoine'],
}

/**
 * Score de similarité texte entre base et vidéo (0-100) – fallback
 */
function scoreMatch(db, video) {
  const dbSlug = slugify(db.slug || '')
  const dbNameSlug = slugify(db.name || '')
  const videoSlug = slugify(video.name || '')

  if (!dbSlug || !videoSlug) return 0

  if (videoSlug === dbSlug || videoSlug === dbNameSlug) return 100
  if (videoSlug.includes(dbSlug) || dbSlug.includes(videoSlug)) return 90
  if (videoSlug.includes(dbNameSlug) || dbNameSlug.includes(videoSlug)) return 85

  const dbWords = dbSlug.split('-').filter((w) => w.length > 2)
  const videoWords = videoSlug.split('-').filter((w) => w.length > 2)

  let matchCount = dbWords.filter((w) => videoSlug.includes(w)).length
  for (const [videoWord, equiv] of Object.entries(VIDEO_SYNONYMS)) {
    if (videoWords.some((vw) => vw.includes(videoWord) || videoWord.includes(vw))) {
      if (equiv.every((e) => dbSlug.includes(e))) matchCount += equiv.length
    }
  }

  const wordScore = (matchCount / Math.max(dbWords.length, 1)) * 60
  const reverseMatch = dbWords.filter((w) => videoWords.some((vw) => vw.includes(w) || w.includes(vw)))
  const reverseScore = (reverseMatch.length / Math.max(dbWords.length, 1)) * 20

  const GENERIC_WORDS = new Set(['base', 'donnees', 'contacts', 'france', 'europe', 'b2b', 'donnee'])
  const distinctiveOverlap = dbWords.filter(
    (w) => w.length >= 5 && !GENERIC_WORDS.has(w) && videoWords.some((vw) => vw.includes(w) || w.includes(vw))
  )
  const distinctiveBonus = distinctiveOverlap.length * 15

  return Math.round(Math.min(100, wordScore + reverseScore + distinctiveBonus))
}

/**
 * Matching via GPT-4o mini (comme generate-new-case-studies pour les use cases)
 */
async function buildMappingWithGPT(databases, videos) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || databases.length === 0 || videos.length === 0) {
    return null
  }

  const basesSummary = databases.map((d) => ({
    slug: d.slug,
    name: d.name,
    hint: (d.shortDescription || d.description || '').slice(0, 300),
  }))
  const videosSummary = videos.map((v) => ({
    id: v.id,
    name: v.name,
    description: (v.description || '').slice(0, 200),
  }))

  const prompt = `Tu dois associer les ${videos.length} vidéos Tella aux bases marketplace qui leur correspondent.

CONTEXTE : Une vidéo est créée à chaque publication de base. Il y a ${videos.length} vidéos et ${databases.length} bases. Certaines bases n'ont pas encore de vidéo. Associe CHAQUE VIDÉO à la base qui correspond le mieux. Tu dois retourner exactement ${Math.min(videos.length, databases.length)} associations (une vidéo = une base max). Utilise le champ "id" des vidéos EXACTEMENT comme fourni (copier-coller). Synonymes : CGP = conseil gestion patrimoine, IA = intelligence artificielle.

BASES :
${JSON.stringify(basesSummary)}

VIDÉOS :
${JSON.stringify(videosSummary)}

Retourne UNIQUEMENT un JSON valide :
{
  "matches": [
    { "slug": "slug-base", "videoId": "id-exact-de-la-video", "videoName": "Titre vidéo", "score": 85 }
  ]
}
- videoId : copie exacte du champ "id" de la vidéo (obligatoire)
- score : 0-100 (100 = même nom, 70+ = correspondance probable)
- Retourne exactement ${Math.min(videos.length, databases.length)} entrées (une par vidéo, chaque vidéo associée à sa meilleure base)`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content:
              'Tu réponds toujours par un JSON valide uniquement, sans texte autour. Format: {"matches": [{ "slug": string, "videoId": string, "videoName": string, "score": number }]}',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.warn('[tella-marketplace-videos] OpenAI error:', response.status, err)
      return null
    }

    const data = await response.json()
    let content = data.choices?.[0]?.message?.content?.trim() || ''
    content = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      const fixed = content.replace(/,(\s*[}\]])/g, '$1').replace(/\n/g, ' ')
      parsed = JSON.parse(fixed || '{"matches":[]}')
    }
    const matches = parsed?.matches || []
    if (matches.length === 0) {
      console.log('[tella-marketplace-videos] GPT a retourné 0 matches')
      return null
    }

    console.log('[tella-marketplace-videos] GPT a retourné', matches.length, 'matches:')
    matches.forEach((m) => console.log('  ', m.slug, '→', m.videoId, '|', m.videoName, '| score', m.score))

    const videoById = Object.fromEntries(videos.map((v) => [v.id, v]))
    const videoIds = videos.map((v) => v.id)
    const dbBySlug = Object.fromEntries(databases.map((d) => [d.slug, d]))

    const findVideo = (id) => {
      if (!id || typeof id !== 'string') return null
      const cleaned = String(id).trim()
      if (videoById[cleaned]) return videoById[cleaned]
      const match = videoIds.find((vid) => vid === cleaned || vid.endsWith(cleaned) || cleaned.endsWith(vid) || vid.includes(cleaned))
      return match ? videoById[match] : null
    }

    const findDatabase = (slug) => {
      if (!slug || typeof slug !== 'string') return null
      const s = String(slug).trim()
      if (dbBySlug[s]) return dbBySlug[s]
      const slugNorm = slugify(s)
      if (!slugNorm) return null
      for (const db of databases) {
        const dbNorm = slugify(db.slug || '')
        const nameNorm = slugify(db.name || '')
        if (dbNorm === slugNorm || nameNorm === slugNorm) return db
        if (dbNorm.includes(slugNorm) || slugNorm.includes(dbNorm)) return db
      }
      return null
    }

    const mapping = {}
    const matched = []
    const assignedVideoIds = new Set()

    // Par vidéo : une vidéo = une base max. On traite les matches GPT et on assigne la meilleure base par vidéo.
    const matchesByVideo = {}
    for (const m of matches) {
      if (m.score < 40 || !m.slug || !m.videoId) continue
      const vid = findVideo(m.videoId)
      if (!vid) {
        console.log('[tella-marketplace-videos] Skip (videoId introuvable):', m.slug, '→ videoId', m.videoId)
        continue
      }
      if (!matchesByVideo[vid.id]) matchesByVideo[vid.id] = []
      matchesByVideo[vid.id].push(m)
    }

    for (const [videoId, videoMatches] of Object.entries(matchesByVideo)) {
      const best = videoMatches.sort((a, b) => (b.score || 0) - (a.score || 0))[0]
      const db = findDatabase(best.slug)
      if (!db) {
        console.log('[tella-marketplace-videos] Skip (slug introuvable): GPT a retourné slug', best.slug, '→ aucune base correspondante')
        continue
      }
      if (mapping[db.slug]) continue

      const video = videoById[videoId]
      const embedUrl =
        video.embedPage?.includes('/embed') || video.embedPage?.endsWith('/embed')
          ? `${video.embedPage}?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
          : `${video.embedPage}/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
      mapping[db.slug] = embedUrl
      matched.push({ slug: db.slug, name: db.name, videoName: video.name, videoId: video.id, score: best.score ?? 80 })
      assignedVideoIds.add(videoId)
      console.log('[tella-marketplace-videos] ✓ GPT match:', db.slug, '→', video.name, '(score', best.score ?? 80, ')')
    }

    const remainingVideos = videos.filter((v) => !assignedVideoIds.has(v.id))
    if (remainingVideos.length > 0) {
      console.log('[tella-marketplace-videos] Vidéos non assignées par GPT:', remainingVideos.map((v) => `${v.name} (${v.id})`).join(', '))
    }

    const matchedSlugs = new Set(matched.map((x) => x.slug))
    const unmatchedBases = databases.filter((db) => !matchedSlugs.has(db.slug))

    // Second pass : fallback textuel pour les bases non matchées par GPT
    if (unmatchedBases.length > 0 && remainingVideos.length > 0) {
      const fallbackResult = buildMappingFallback(unmatchedBases, remainingVideos)
      for (const fb of fallbackResult.matched) {
        const embedUrl = fallbackResult.mapping[fb.slug]
        if (embedUrl) {
          mapping[fb.slug] = embedUrl
          matched.push(fb)
          console.log(`[tella-marketplace-videos] Fallback textuel: ${fb.slug} → ${fb.videoName} (score ${fb.score})`)
        }
      }
    }

    const finalMatchedSlugs = new Set(matched.map((x) => x.slug))
    const unmatched = databases
      .filter((db) => !finalMatchedSlugs.has(db.slug))
      .map((db) => ({ slug: db.slug, name: db.name }))

    return { mapping, matched, unmatched }
  } catch (e) {
    console.warn('[tella-marketplace-videos] GPT matching error:', e.message)
    return null
  }
}

/**
 * Chaque vidéo n'est assignée qu'à la base avec le meilleur score (fallback textuel)
 */
function buildMappingFallback(databases, videos) {
  const mapping = {}
  const matched = []
  const unmatched = []

  const scores = []
  for (const db of databases) {
    for (const v of videos) {
      const score = scoreMatch(db, v)
      if (score >= 40) scores.push({ db, video: v, score })
    }
  }

  const videoToBest = {}
  for (const { db, video, score } of scores) {
    const prev = videoToBest[video.id]
    if (!prev || score > prev.score) {
      videoToBest[video.id] = { db, score }
    }
  }

  for (const db of databases) {
    const best = scores
      .filter((s) => s.db.slug === db.slug)
      .sort((a, b) => b.score - a.score)[0]
    if (!best) {
      unmatched.push({ slug: db.slug, name: db.name })
      continue
    }
    const assigned = videoToBest[best.video.id]
    if (assigned?.db.slug !== db.slug) {
      unmatched.push({ slug: db.slug, name: db.name })
      continue
    }
    const embedUrl =
      best.video.embedPage.includes('/embed') || best.video.embedPage.endsWith('/embed')
        ? `${best.video.embedPage}?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
        : `${best.video.embedPage}/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
    mapping[db.slug] = embedUrl
    matched.push({ slug: db.slug, name: db.name, videoName: best.video.name, videoId: best.video.id, score: best.score })
  }

  return { mapping, matched, unmatched }
}

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const hasValidSecret =
    process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL

  if (!isVercelCron && !hasValidSecret && !isLocalDev) {
    return res.status(401).json({
      message: 'Unauthorized',
      hint: 'Vercel Cron ou Authorization: Bearer CRON_SECRET requis',
    })
  }

  const apiKey = process.env.TELLA_API_KEY
  const playlistId =
    process.env.TELLA_MARKETPLACE_PLAYLIST_ID || process.env.TELLA_TARGET_PLAYLIST_ID

  if (!apiKey || !playlistId) {
    return res.status(500).json({
      error: 'TELLA_API_KEY et TELLA_TARGET_PLAYLIST_ID (ou TELLA_MARKETPLACE_PLAYLIST_ID) requis',
    })
  }

  try {
    const [databases, videos] = await Promise.all([
      getAllDatabases(),
      listVideosByPlaylist(playlistId, apiKey),
    ])

    console.log('[tella-marketplace-videos] Données chargées:')
    console.log('  Bases:', databases.length, '—', databases.map((d) => d.slug).join(', '))
    console.log('  Vidéos:', videos.length, '—', videos.map((v) => `${v.name} (${v.id})`).join(' | '))

    let mappingResult = await buildMappingWithGPT(databases, videos)
    if (!mappingResult) {
      mappingResult = buildMappingFallback(databases, videos)
      console.log('[tella-marketplace-videos] Fallback scoring textuel (OPENAI_API_KEY absent ou erreur)')
    }
    const { mapping, matched, unmatched } = mappingResult

    const payload = {
      mapping,
      updatedAt: new Date().toISOString(),
      stats: {
        totalDatabases: databases.length,
        totalVideos: videos.length,
        matched: matched.length,
        unmatched: unmatched.length,
      },
      matched,
      unmatched,
      _debug: {
        videos: videos.map((v) => ({ id: v.id, name: v.name })),
        assignedVideoIds: matched.map((m) => m.videoId),
        unassignedVideoNames: videos
          .filter((v) => !matched.some((m) => m.videoId === v.id))
          .map((v) => v.name),
      },
    }

    await put(MAPPING_BLOB_KEY, JSON.stringify(payload, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    })

    console.log(
      '[tella-marketplace-videos]',
      `matched ${matched.length}/${databases.length} bases, ${videos.length} vidéos Tella`
    )
    if (unmatched.length > 0) {
      console.log('[tella-marketplace-videos] Unmatched:', unmatched.map((u) => u.slug).join(', '))
    }

    return res.status(200).json({
      ok: true,
      ...payload.stats,
      matched,
      unmatched: unmatched.slice(0, 20),
      _debug: payload._debug,
    })
  } catch (err) {
    console.error('[tella-marketplace-videos]', err)
    return res.status(500).json({ error: err.message })
  }
}

export const config = {
  maxDuration: 60,
}
