/**
 * Politique qualité / indexation des cas d'usage (pSEO)
 *
 * Rôle :
 * - /blog = contenu éditorial (guides, intention informationnelle)
 * - /cas-usage = landing commerciale (intention transactionnelle : faire scraper X)
 *
 * Une page cas d'usage ne doit être indexée que si elle apporte un angle
 * commercial distinct, pas un doublon de fiche template.
 */

import { getCaseStudyRedirect } from './case-studies-gsc-policy'
import { isSlugTrafficIndexable } from './case-studies-indexable-slugs'

/** Intention plutôt transactionnelle (ok pour cas d'usage) */
const COMMERCIAL_INTENT_RE =
  /\b(scrap(e|er|ing|peur|peur|ping)?|extraction|extraire|données|data|leads?|emails?|contacts?|api|automatis|prix|avis|reviews?|profils?|annuaire)\b/i

/** Intention plutôt informationnelle (plutôt blog) */
const INFORMATIONAL_INTENT_RE =
  /\b(comment|pourquoi|qu['']est[- ]ce|guide|tutoriel|tutorial|c['']est quoi|définition|meilleur(e|es)?|vs\b|comparatif|avis sur)\b/i

export function hasCommercialIntent(text) {
  if (!text) return false
  return COMMERCIAL_INTENT_RE.test(text)
}

export function hasInformationalIntent(text) {
  if (!text) return false
  return INFORMATIONAL_INTENT_RE.test(text)
}

/**
 * Indexation des fiches : trafic réel sur 28 jours (PostHog / GSC quand dispo).
 * Liste figée dans lib/case-studies-indexable-slugs.js — pas d’appel API à la requête.
 * Les redirections 301 restent non indexables.
 */
export function isCaseStudyIndexable(caseStudy, _personalizedData = null) {
  if (!caseStudy?.slug) return false
  if (getCaseStudyRedirect(caseStudy.slug)) return false
  return isSlugTrafficIndexable(caseStudy.slug)
}

function tokenize(str) {
  if (!str || typeof str !== 'string') return []
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

function jaccard(a, b) {
  const setA = new Set(tokenize(a))
  const setB = new Set(tokenize(b))
  if (setA.size === 0 || setB.size === 0) return 0
  let inter = 0
  for (const w of setA) {
    if (setB.has(w)) inter++
  }
  return inter / (setA.size + setB.size - inter)
}

/**
 * Charge les articles blog depuis le blob (titres + slugs) pour anti-cannibalisation.
 */
export async function loadBlogIndexFromBlob() {
  try {
    const { list } = await import('@vercel/blob')
    const blobs = await list({ prefix: 'blog-posts.json' })
    const blob = blobs.blobs.find((b) => b.pathname === 'blog-posts.json')
    if (!blob) return []
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    const posts = Array.isArray(data) ? data : data.posts || data.articles || []
    return posts
      .filter((p) => p && (p.title || p.slug))
      .map((p) => ({
        title: p.title || '',
        slug: p.slug || '',
        metaDescription: p.metaDescription || p.description || '',
        tags: p.tags || [],
      }))
  } catch (e) {
    console.warn('[case-studies-quality] blog index:', e.message)
    return []
  }
}

/**
 * Le cas d'usage cannibalise-t-il un article de blog existant ?
 * @returns {{ cannibalizes: boolean, reason?: string, blog?: object }}
 */
export function checkBlogCannibalization(newCase, blogPosts = []) {
  if (!blogPosts.length) return { cannibalizes: false }

  const title = newCase.title || ''
  const keywords = (newCase.keywords || []).join(' ')
  const haystack = `${title} ${keywords} ${(newCase.examples || []).join(' ')}`

  // Intention purement informationnelle → laisser au blog
  if (hasInformationalIntent(title) && !hasCommercialIntent(title)) {
    return {
      cannibalizes: true,
      reason: 'intention informationnelle (mieux pour le blog)',
    }
  }

  let best = null
  for (const post of blogPosts) {
    const blogText = `${post.title} ${post.slug.replace(/-/g, ' ')} ${(post.tags || []).join(' ')}`
    const scoreTitle = jaccard(title, post.title)
    const scoreAll = jaccard(haystack, blogText)
    const score = Math.max(scoreTitle, scoreAll)

    // Slug blog très proche du slug cas d'usage
    const csSlug = (newCase.slug || '').replace(/^scraping-/, '')
    const blogSlug = (post.slug || '').replace(/^(comment-|guide-|tutoriel-)/, '')
    const slugScore = jaccard(csSlug.replace(/-/g, ' '), blogSlug.replace(/-/g, ' '))

    const finalScore = Math.max(score, slugScore)
    if (!best || finalScore > best.score) {
      best = { post, score: finalScore }
    }
  }

  if (best && best.score >= 0.42) {
    return {
      cannibalizes: true,
      reason: `proche du blog « ${best.post.title} » (${Math.round(best.score * 100)}%)`,
      blog: best.post,
    }
  }

  return { cannibalizes: false }
}
