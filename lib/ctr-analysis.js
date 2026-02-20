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

/**
 * Lit le titre et la meta depuis le blob (source de vérité) plutôt que
 * de scraper la prod en HTTP — plus rapide, plus fiable, fonctionne en local.
 */
export async function fetchPageMeta(pagePath) {
  const source = getPageSource(pagePath)

  try {
    if (source.source === 'blog') {
      const slug = source.identifier
      // Essayer d'abord le fichier individuel
      const articleBlob = await head(`blog-posts/${slug}.json`)
      if (articleBlob) {
        const res = await fetch(articleBlob.url, { cache: 'no-store' })
        if (res.ok) {
          const article = await res.json()
          return {
            title: article.metaTitle || article.title || '',
            metaDescription: article.metaDescription || '',
          }
        }
      }
      // Fallback liste blog-posts.json
      const listBlobs = await list({ prefix: 'blog-posts.json' })
      const listBlob = listBlobs.blobs.find((b) => b.pathname === 'blog-posts.json')
      if (listBlob) {
        const res = await fetch(listBlob.url, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const post = (data.posts || []).find((p) => p.slug === slug)
          if (post) return { title: post.metaTitle || post.title || '', metaDescription: post.metaDescription || '' }
        }
      }
    }

    if (source.source === 'cas-usage') {
      const slug = source.identifier
      const blobs = await list({ prefix: 'case-studies.json' })
      const blob = blobs.blobs.find((b) => b.pathname === 'case-studies.json')
      if (blob) {
        const res = await fetch(blob.url, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const cs = (data.caseStudies || []).find((c) => c.slug === slug)
          if (cs) return { title: cs.metaTitle || cs.title || '', metaDescription: cs.metaDescription || '' }
        }
      }
    }

    if (source.source === 'marketplace') {
      const dbSlug = source.identifier
      const blobs = await list({ prefix: 'marketplace-databases.json' })
      const blob = blobs.blobs.find((b) => b.pathname === 'marketplace-databases.json')
      if (blob) {
        const res = await fetch(blob.url, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const databases = data.databases || (Array.isArray(data) ? data : [])
          const db = databases.find((d) => d.slug === dbSlug)
          if (db) return { title: db.metaTitle || db.name || '', metaDescription: db.metaDescription || db.shortDescription || '' }
        }
      }
    }
  } catch {
    // fallback ci-dessous
  }

  return { title: '', metaDescription: '' }
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
 * gpt-4o-mini est suffisant pour réécrire titre + meta (tâche de copywriting contrainte).
 * Bien plus rapide (~3s vs ~18s) — permet de monter à 10 pages/run sans dépasser 60s.
 */
const SEO_MODEL = 'gpt-4o-mini'

/**
 * @param {string} pagePath
 * @param {string} currentTitle
 * @param {string} currentMeta
 * @param {number} impressions
 * @param {number} ctr
 * @param {number} position
 * @param {string} pageContext - contenu blob (keywords, useCase, etc.)
 * @param {Array<{query, impressions, clicks, ctr, position}>} topQueries - requêtes SC réelles de cette page
 */
export async function getSuggestionsFromGPT(pagePath, currentTitle, currentMeta, impressions, ctr, position, pageContext = '', topQueries = []) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return []

  const source = getPageSource(pagePath)

  // Bloc queries SC — le signal le plus fort pour écrire le bon titre
  const queriesBlock = topQueries.length > 0
    ? `REQUÊTES RÉELLES qui amènent du trafic sur cette page (Search Console) :
${topQueries.map((q) => `- "${q.query}" → ${q.impressions} imp, pos ${Math.round(q.position)}, CTR ${q.ctr.toFixed(1)}%`).join('\n')}

→ RÈGLE ABSOLUE : la requête principale (1ère ligne) DOIT apparaître dans le titre, mot pour mot ou très proche. C'est ce que les utilisateurs tapent.`
    : ''

  // Bloc contenu blob
  const contextBlock = pageContext
    ? `CONTENU DE LA PAGE :
${pageContext}
→ Extraire : bénéfice principal, chiffres concrets, exemples cités, secteur. Les intégrer dans la meta.`
    : ''

  const prompt = `Tu es un copywriter SEO expert. Ta mission : réécrire le titre et la meta description d'une page web pour maximiser son CTR dans les SERP Google françaises.

URL : ${BASE_URL}${pagePath} (type: ${source.source})
Métriques actuelles : ${impressions} impressions, CTR ${ctr.toFixed(1)}%, position ${Math.round(position)}

${queriesBlock}

${contextBlock}

TITRE ACTUEL : "${(currentTitle || '').slice(0, 100)}"
META ACTUELLE : "${(currentMeta || '').slice(0, 160)}"

CONTRAINTES :
- Titre : 50-60 caractères. Mot-clé principal en tête (= requête #1 SC). Puis chiffre OU bénéfice concret.
- Meta : 150-160 caractères. Reprendre 2-3 variantes de la requête principale. Bénéfice clair. CTA implicite ("Téléchargez", "Démarrez", "Obtenez").
- Ton : professionnel B2B français. Pas de majuscules excessives. Fidèle au contenu réel.

Réponds UNIQUEMENT en JSON :
{"title":"...","metaDescription":"..."}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: SEO_MODEL,
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          { role: 'system', content: 'Tu es un expert SEO. Réponds UNIQUEMENT en JSON valide, sans texte autour.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    let content = data.choices?.[0]?.message?.content?.trim() || '{}'
    content = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(content)
    // Normaliser : que ce soit { title, metaDescription } ou { suggestions: [...] }
    if (parsed.title) return [{ title: parsed.title, metaDescription: parsed.metaDescription || '' }]
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
