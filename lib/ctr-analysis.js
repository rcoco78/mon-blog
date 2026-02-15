/**
 * Helpers pour l'analyse CTR — mapping page → source d'édition + application auto aux blobs
 */

import { list, put, head } from '@vercel/blob'

const BASE_URL = 'https://www.corentinrobert.fr'

/**
 * Détermine où éditer le titre/meta selon le path
 * @param {string} pagePath - ex. /blog/scraping-linkedin, /cas-usage/recrutement-rh/scraping-apec
 * @returns {{ source: string, editIn: string, identifier?: string }}
 */
export function getPageSource(pagePath) {
  const path = (pagePath || '').replace(/\/$/, '') || '/'

  if (path.startsWith('/blog/')) {
    const slug = path.replace(/^\/blog\//, '').split('/')[0]
    return {
      source: 'blog',
      editIn: 'Blob blog-posts.json ou Notion (page source)',
      identifier: slug,
    }
  }

  if (path.match(/^\/cas-usage\/[^/]+\/[^/]+/)) {
    const parts = path.replace(/^\/cas-usage\//, '').split('/')
    const slug = parts[1]
    return {
      source: 'cas-usage',
      editIn: 'Blob case-studies.json',
      identifier: slug,
    }
  }

  if (path.match(/^\/marketplace\/[^/]+\/[^/]+/)) {
    const parts = path.replace(/^\/marketplace\//, '').split('/')
    const dbSlug = parts[1]
    return {
      source: 'marketplace',
      editIn: 'Blob marketplace-databases.json',
      identifier: dbSlug,
    }
  }

  const staticPages = {
    '/': { editIn: 'lib/config.js → seo.pages.home' },
    '/contact': { editIn: 'lib/config.js → seo.pages.contact' },
    '/a-propos': { editIn: 'lib/config.js → seo.pages.aPropos' },
    '/blog': { editIn: 'lib/config.js → seo.pages.blog' },
    '/faq': { editIn: 'lib/config.js ou pages/faq.js' },
    '/objectifs': { editIn: 'pages/objectifs.js' },
    '/temoignages': { editIn: 'pages/temoignages.js' },
  }
  const staticPage = staticPages[path]
  if (staticPage) {
    return { source: 'config/page', editIn: staticPage.editIn }
  }

  return { source: 'inconnu', editIn: 'À déterminer selon la page' }
}

export async function fetchPageMeta(pagePath) {
  try {
    const url = BASE_URL + pagePath
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CTR-Cron/1.0)' },
    })
    const html = await res.text()
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''
    const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim() || ''
    return { title, metaDescription: metaDesc }
  } catch {
    return { title: '', metaDescription: '' }
  }
}

/**
 * Récupère le contexte de la page depuis le blob (contenu réel) pour enrichir le prompt GPT
 * @param {string} pagePath
 * @returns {Promise<string>} Contexte résumé pour le prompt
 */
export async function fetchPageContextFromBlob(pagePath) {
  const source = getPageSource(pagePath)
  const MAX_CONTENT = 1200

  try {
    if (source.source === 'blog') {
      const slug = source.identifier
      const articleBlob = await head(`blog-posts/${slug}.json`)
      if (articleBlob) {
        const res = await fetch(articleBlob.url, { cache: 'no-store' })
        if (res.ok) {
          const article = await res.json()
          const parts = []
          if (article.title) parts.push(`Titre: ${article.title}`)
          if (article.metaDescription) parts.push(`Meta actuelle: ${article.metaDescription}`)
          if (article.tags?.length) parts.push(`Tags: ${article.tags.join(', ')}`)
          if (article.contentMarkdown) {
            const text = article.contentMarkdown.replace(/#{1,6}\s/g, '').replace(/\n+/g, ' ')
            parts.push(`Contenu (extrait): ${text.slice(0, MAX_CONTENT)}${text.length > MAX_CONTENT ? '...' : ''}`)
          }
          return parts.join('\n')
        }
      }
      // Fallback : liste blog-posts.json (titre, meta, tags)
      const listBlobs = await list({ prefix: 'blog-posts.json' })
      const listBlob = listBlobs.blobs.find((b) => b.pathname === 'blog-posts.json')
      if (listBlob) {
        const res = await fetch(listBlob.url, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const post = (data.posts || []).find((p) => p.slug === slug)
          if (post) {
            const parts = []
            if (post.title) parts.push(`Titre: ${post.title}`)
            if (post.metaDescription) parts.push(`Meta actuelle: ${post.metaDescription}`)
            if (post.tags?.length) parts.push(`Tags: ${post.tags.join(', ')}`)
            return parts.join('\n')
          }
        }
      }
      return ''
    }

    if (source.source === 'cas-usage') {
      const slug = source.identifier
      const blobs = await list({ prefix: 'case-studies.json' })
      const blob = blobs.blobs.find((b) => b.pathname === 'case-studies.json')
      if (!blob) return ''
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (!res.ok) return ''
      const data = await res.json()
      const cs = (data.caseStudies || []).find((c) => c.slug === slug)
      if (!cs) return ''
      const parts = []
      if (cs.title) parts.push(`Titre: ${cs.title}`)
      if (cs.description) parts.push(`Description: ${cs.description}`)
      if (cs.sector) parts.push(`Secteur: ${cs.sector}`)
      if (cs.examples?.length) parts.push(`Exemples sources: ${cs.examples.slice(0, 5).join(', ')}`)
      if (cs.dataExtracted?.length) parts.push(`Données extractibles: ${cs.dataExtracted.slice(0, 8).join(', ')}`)
      if (cs.keywords?.length) parts.push(`Mots-clés: ${cs.keywords.slice(0, 10).join(', ')}`)
      if (cs.useCase) parts.push(`Cas d'usage: ${cs.useCase.slice(0, 300)}`)
      return parts.join('\n')
    }

    if (source.source === 'marketplace') {
      const dbSlug = source.identifier
      const blobs = await list({ prefix: 'marketplace-databases.json' })
      const blob = blobs.blobs.find((b) => b.pathname === 'marketplace-databases.json')
      if (!blob) return ''
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (!res.ok) return ''
      const data = await res.json()
      const databases = data.databases || (Array.isArray(data) ? data : [])
      const db = databases.find((d) => d.slug === dbSlug)
      if (!db) return ''
      const parts = []
      if (db.name) parts.push(`Nom: ${db.name}`)
      if (db.description) parts.push(`Description: ${db.description}`)
      if (db.shortDescription) parts.push(`Description courte: ${db.shortDescription}`)
      if (db.category) parts.push(`Catégorie: ${db.category}`)
      if (db.rowCount) parts.push(`Nombre d'entrées: ${db.rowCount}`)
      if (db.headers?.length) parts.push(`Colonnes: ${db.headers.slice(0, 10).join(', ')}`)
      if (db.enrichedData?.keywords?.length) {
        parts.push(`Mots-clés SEO: ${db.enrichedData.keywords.slice(0, 8).join(', ')}`)
      }
      if (db.enrichedData?.useCases?.length) {
        parts.push(`Cas d'usage: ${db.enrichedData.useCases.slice(0, 3).join(' | ')}`)
      }
      return parts.join('\n')
    }
  } catch (e) {
    console.warn('[ctr-analysis] fetchPageContextFromBlob failed:', e.message)
  }
  return ''
}

/**
 * Modèle GPT pour optimisation SEO — meilleur modèle disponible
 */
const SEO_MODEL = 'gpt-4o'

export async function getSuggestionsFromGPT(pagePath, currentTitle, currentMeta, impressions, ctr, position, pageContext = '') {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return []

  const source = getPageSource(pagePath)

  const contextBlock = pageContext
    ? `

CONTENU RÉEL DE LA PAGE (source de vérité — analyse-le pour optimiser) :
${pageContext}

→ Utilise ce contenu pour : extraire les mots-clés prioritaires, identifier le bénéfice principal, les chiffres concrets (ex: X entrées, X€), les sources/exemples cités, le secteur. Intègre-les dans titre et meta pour un SEO maximal (pertinence + CTR).`
    : ''

  const prompt = `Tu es un expert SEO spécialisé en optimisation des titres et meta descriptions pour les SERP Google.

PAGE :
- URL : ${BASE_URL}${pagePath}
- Type : ${source.source}
- Métriques : ${impressions} impressions, CTR ${ctr.toFixed(1)}%, position ~${Math.round(position)}
${contextBlock}

ACTUEL (live) :
- Titre : "${(currentTitle || '').slice(0, 100)}"
- Meta : "${(currentMeta || '').slice(0, 160)}"

MISSION : Proposer LA MEILLEURE variante titre + meta pour maximiser CTR ET pertinence SEO.

MÉTHODE :
1. Analyse le contenu réel : quels mots-clés, bénéfices, chiffres, différenciateurs ?
2. Titre (50-60 car.) : mot-clé principal en tête, puis chiffre OU bénéfice concret tiré du contenu
3. Meta (150-160 car.) : reprendre les termes que les utilisateurs chercheront, le bénéfice clair, un CTA implicite. Mentionner des éléments spécifiques du contenu si pertinent (ex: "IAD", "7 jours", "Google Sheets")

RÈGLES :
- Reste fidèle au contenu : pas de promesse que la page ne tient pas
- Public français B2B, ton professionnel
- Pas de majuscules excessives, pas de clickbait

Réponds UNIQUEMENT en JSON valide :
{ "suggestions": [{ "title": "...", "metaDescription": "..." }, { "title": "...", "metaDescription": "..." }, { "title": "...", "metaDescription": "..." }] }

Propose 3 variantes, la première étant la meilleure.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: SEO_MODEL,
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: 'system', content: 'Tu es un expert SEO. Tu réponds UNIQUEMENT en JSON valide, sans texte autour.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    let content = data.choices?.[0]?.message?.content?.trim() || '{}'
    content = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(content)
    return parsed.suggestions || []
  } catch {
    return []
  }
}

/**
 * Applique la meilleure suggestion titre/meta au blob concerné
 * @param {{ source: string, identifier?: string }} pageSource
 * @param {{ title: string, metaDescription: string }} suggestion
 * @returns {{ applied: boolean, error?: string }}
 */
export async function applyOptimizationToBlob(pageSource, suggestion) {
  if (!suggestion?.title || !suggestion?.metaDescription) {
    return { applied: false, error: 'Suggestion invalide' }
  }
  if (!['blog', 'cas-usage', 'marketplace'].includes(pageSource.source)) {
    return { applied: false, error: `Source non gérée: ${pageSource.source}` }
  }
  if (!pageSource.identifier) {
    return { applied: false, error: 'Identifier manquant' }
  }

  const title = String(suggestion.title).slice(0, 70).trim()
  const metaDescription = String(suggestion.metaDescription).slice(0, 165).trim()

  try {
    if (pageSource.source === 'blog') {
      const slug = pageSource.identifier
      // 1. Mettre à jour blog-posts/{slug}.json
      const articleBlob = await head(`blog-posts/${slug}.json`)
      if (articleBlob) {
        const res = await fetch(articleBlob.url, { cache: 'no-store' })
        if (res.ok) {
          const article = await res.json()
          const updated = { ...article, title, metaDescription }
          await put(`blog-posts/${slug}.json`, JSON.stringify(updated, null, 2), {
            access: 'public',
            allowOverwrite: true,
          })
        }
      }
      // 2. Mettre à jour la liste blog-posts.json
      const listBlobs = await list({ prefix: 'blog-posts.json' })
      const listBlob = listBlobs.blobs.find((b) => b.pathname === 'blog-posts.json')
      if (listBlob) {
        const res = await fetch(listBlob.url, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const posts = (data.posts || []).map((p) =>
            p.slug === slug ? { ...p, title, metaDescription } : p,
          )
          await put(
            'blog-posts.json',
            JSON.stringify({ posts, lastUpdated: new Date().toISOString() }, null, 2),
            { access: 'public', allowOverwrite: true },
          )
        }
      }
      // 3. Mettre à jour Notion via requête par slug (évite que blog-sync écrase nos optimisations)
      const token = process.env.NOTION_TOKEN
      const databaseId = process.env.NOTION_DATABASE_ID
      if (token && databaseId) {
        try {
          const { Client } = await import('@notionhq/client')
          const notion = new Client({ auth: token })
          const { results } = await notion.databases.query({
            database_id: databaseId,
            filter: { property: '/slug', rich_text: { equals: slug } },
            page_size: 1,
          })
          if (results.length > 0) {
            await notion.pages.update({
              page_id: results[0].id,
              properties: {
                Title: { title: [{ text: { content: title } }] },
                'Meta Description': { rich_text: [{ text: { content: metaDescription } }] },
              },
            })
          }
        } catch (e) {
          console.warn('[ctr-analysis] Notion update failed:', e.message)
        }
      }
      return { applied: true }
    }

    if (pageSource.source === 'cas-usage') {
      const slug = pageSource.identifier
      const blobs = await list({ prefix: 'case-studies.json' })
      const blob = blobs.blobs.find((b) => b.pathname === 'case-studies.json')
      if (!blob) return { applied: false, error: 'Blob case-studies.json introuvable' }
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (!res.ok) return { applied: false, error: `Fetch ${res.status}` }
      const data = await res.json()
      const caseStudies = data.caseStudies || []
      const idx = caseStudies.findIndex((cs) => cs.slug === slug)
      if (idx < 0) return { applied: false, error: `Cas non trouvé: ${slug}` }
      caseStudies[idx] = {
        ...caseStudies[idx],
        metaTitle: title,
        metaDescription,
        lastSeoOptimized: new Date().toISOString(),
      }
      await put(
        'case-studies.json',
        JSON.stringify(
          { caseStudies, lastUpdated: data.lastUpdated || new Date().toISOString() },
          null,
          2,
        ),
        { access: 'public', allowOverwrite: true },
      )
      return { applied: true }
    }

    if (pageSource.source === 'marketplace') {
      const dbSlug = pageSource.identifier
      const blobs = await list({ prefix: 'marketplace-databases.json' })
      const blob = blobs.blobs.find((b) => b.pathname === 'marketplace-databases.json')
      if (!blob) return { applied: false, error: 'Blob marketplace-databases.json introuvable' }
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (!res.ok) return { applied: false, error: `Fetch ${res.status}` }
      const data = await res.json()
      const databases = data.databases || data || []
      const arr = Array.isArray(databases) ? databases : []
      const idx = arr.findIndex((db) => db.slug === dbSlug)
      if (idx < 0) return { applied: false, error: `DB non trouvée: ${dbSlug}` }
      arr[idx] = {
        ...arr[idx],
        metaTitle: title,
        metaDescription,
        lastSeoOptimized: new Date().toISOString(),
      }
      const payload = Array.isArray(data.databases) ? { ...data, databases: arr } : arr
      await put(
        'marketplace-databases.json',
        JSON.stringify(payload, null, 2),
        { access: 'public', allowOverwrite: true },
      )
      return { applied: true }
    }
  } catch (e) {
    return { applied: false, error: e.message }
  }

  return { applied: false, error: 'Non implémenté' }
}
