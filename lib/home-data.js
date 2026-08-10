/**
 * Fetch des données home en parallèle côté serveur (getStaticProps).
 * Évite les waterfalls côté client.
 */
import { siteConfig } from './config'
import { getKeyResults } from './notion'
import { caseStudies as localCaseStudies } from './case-studies'
import { fetchBlobJson, withTimeout } from './blob-cache'
import { captureDataError } from './sentry'
import { enrichKeyResultsWithApifyLive, enrichMetricsWithApifyLive } from './apify-live-stats'
import { enrichKeyResultsWithMarketplaceProof } from './project-count'

const METRICS_FILENAME = 'metrics.json'
const KEY_RESULTS_FILENAME = 'key-results.json'
const BLOG_VIEWS_EVENTS = 'blog-views-events.json'
const FETCH_TIMEOUT_MS = 8000

/** Aligne « projets réalisés » sur Malt + Fiverr (profils publics). */
function alignProjectsMetric(metrics) {
  if (!Array.isArray(metrics)) return metrics
  const malt = siteConfig.socialProof?.malt?.projects
  const fiverr = siteConfig.socialProof?.fiverr?.projects
  if (!malt) return metrics

  const hasFiverr = Number.isFinite(fiverr) && fiverr > 0
  const total = malt + (hasFiverr ? fiverr : 0)

  return metrics.map((m) => {
    if (m.label !== 'projets réalisés') return m

    return {
      ...m,
      value: String(total),
      source: hasFiverr ? 'Malt & Fiverr' : 'sur Malt',
      href: m.href || siteConfig.social.malt,
      breakdown: hasFiverr ? { malt, fiverr } : null,
    }
  })
}

async function fetchMetrics() {
  try {
    const data = await withTimeout(fetchBlobJson(METRICS_FILENAME), FETCH_TIMEOUT_MS, null)
    if (data?.metrics) {
      const enriched = await enrichMetricsWithApifyLive(data.metrics)
      return alignProjectsMetric(enriched)
    }
  } catch (e) {
    captureDataError(e, { source: 'blob', tags: { area: 'metrics' } })
    console.warn('home-data: metrics fetch error', e.message)
  }
  return alignProjectsMetric(await enrichMetricsWithApifyLive(siteConfig.metrics))
}

async function enrichKeyResults(keyResults) {
  return enrichKeyResultsWithMarketplaceProof(
    await enrichKeyResultsWithApifyLive(keyResults)
  )
}

async function fetchKeyResults() {
  try {
    const data = await withTimeout(fetchBlobJson(KEY_RESULTS_FILENAME), FETCH_TIMEOUT_MS, null)
    if (data?.keyResults && Array.isArray(data.keyResults)) {
      return await enrichKeyResults(data.keyResults)
    }
    const fromNotion = await withTimeout(getKeyResults(), FETCH_TIMEOUT_MS, [])
    return await enrichKeyResults(fromNotion)
  } catch (e) {
    captureDataError(e, { source: 'notion', tags: { area: 'key-results' } })
    console.warn('home-data: key-results fetch error', e.message)
  }
  return []
}

async function fetchBlogViewsMap() {
  try {
    const events = await withTimeout(fetchBlobJson(BLOG_VIEWS_EVENTS), FETCH_TIMEOUT_MS, null)
    const arr = Array.isArray(events) ? events : []
    const map = {}
    arr.forEach((e) => {
      if (e.slug) map[e.slug] = (map[e.slug] || 0) + 1
    })
    return map
  } catch (e) {
    captureDataError(e, { source: 'blob', tags: { area: 'blog-views' } })
    console.warn('home-data: blog views fetch error', e.message)
  }
  return {}
}

function enrichMetricsWithKeyResults(baseMetrics, keyResultsData) {
  if (!keyResultsData || keyResultsData.length === 0) return baseMetrics

  const caFreelanceKRs = keyResultsData.filter((kr) => {
    const c = (kr.category || '').toLowerCase()
    const n = (kr.name || '').toLowerCase()
    return (c.includes('freelance') || c.includes('freelancing')) && (n.includes('ca') || n.includes('chiffre')) && !n.includes('affiliation')
  })
  const caFreelanceTotalKR = caFreelanceKRs.find((kr) => (kr.name || '').toLowerCase().includes('total'))
  let caFreelance = caFreelanceTotalKR ? (caFreelanceTotalKR.targetResult || 0) : (caFreelanceKRs.length > 0 ? Math.max(...caFreelanceKRs.map((kr) => kr.targetResult || 0)) : 0)

  const caAffiliationKRs = keyResultsData.filter((kr) => {
    const c = (kr.category || '').toLowerCase()
    const n = (kr.name || '').toLowerCase()
    return (c.includes('affiliation') || c.includes('partenariats')) && (n.includes('ca') || n.includes('chiffre') || n.includes('revenus'))
  })
  const caAffiliationTotalKR = caAffiliationKRs.find((kr) => (kr.name || '').toLowerCase().includes('total'))
  let caAffiliation = caAffiliationTotalKR
    ? caAffiliationTotalKR.targetResult || 0
    : caAffiliationKRs.length > 0
      ? caAffiliationKRs.reduce((s, kr) => s + (kr.targetResult || 0), 0)
      : 0

  const caLogementKRs = keyResultsData.filter((kr) => {
    const c = (kr.category || '').toLowerCase()
    const n = (kr.name || '').toLowerCase()
    return (c.includes('logement') || c.includes('entrepreneurial')) && (n.includes('arr') || n.includes('ca') || n.includes('chiffre')) && n.includes('logement')
  })
  const caLogementTotalKR = caLogementKRs.find((kr) => (kr.name || '').toLowerCase().includes('arr'))
  let caLogementAtypique = caLogementTotalKR ? (caLogementTotalKR.targetResult || 0) : (caLogementKRs.length > 0 ? Math.max(...caLogementKRs.map((kr) => kr.targetResult || 0)) : 0)

  const totalCA = caFreelance + caAffiliation + caLogementAtypique
  const totalKeyResults = keyResultsData.length
  const overallProgress = totalKeyResults > 0 ? Math.round(keyResultsData.reduce((s, kr) => s + (kr.progress || 0), 0) / totalKeyResults) : 0

  const enriched = [...baseMetrics]

  const abonnesKR = keyResultsData.find((kr) => {
    const n = (kr.name || '').toLowerCase()
    const c = (kr.category || '').toLowerCase()
    return (n.includes('abonnés') || n.includes('abonne')) && (c.includes('logement') || c.includes('entrepreneurial'))
  })
  if (abonnesKR && abonnesKR.currentResult) {
    const idx = enriched.findIndex((m) => m.label === 'scrapers publics' || m.source === 'sur Apify')
    if (idx >= 0) {
      enriched[idx] = { value: String(abonnesKR.currentResult), label: 'abonnés', source: 'Logement Atypique' }
    }
  }

  if (totalCA > 0) {
    const fmt = (num) => (num >= 1000 ? num.toLocaleString('fr-FR') : String(num))
    const caMetric = {
      value: `${fmt(Math.round(totalCA / 1000))}k €`,
      label: 'Objectif 2026',
      source: 'CA cumulé — build in public',
      href: '/objectifs',
    }
    if (enriched.length >= 4) enriched[3] = caMetric
    else enriched.push(caMetric)
  }

  if (overallProgress > 0 && enriched.length < 4) {
    enriched.push({ value: `${overallProgress}%`, label: 'progression', source: 'objectifs 2026', href: '/objectifs' })
  }

  return enriched.slice(0, 4)
}

function postText(post) {
  const tags = Array.isArray(post.tags) ? post.tags.join(' ') : ''
  return `${post.title || ''} ${post.metaDescription || ''} ${tags}`.toLowerCase()
}

function isLifestylePost(post) {
  const text = postText(post)
  return (siteConfig.homepage.lifestyleArticleKeywords || []).some((kw) => text.includes(kw.toLowerCase()))
}

function isBusinessPost(post) {
  if (isLifestylePost(post)) return false
  const text = postText(post)
  return (siteConfig.homepage.businessArticleKeywords || []).some((kw) => text.includes(kw.toLowerCase()))
}

function selectTopBusinessPosts(posts, viewsMap, limit = 3) {
  if (!posts || posts.length === 0) return []

  const withViews = posts.map((p) => ({ ...p, views: viewsMap[p.slug] || 0 }))
  const bySlug = new Map(withViews.map((p) => [p.slug, p]))

  // Pins manuels d'abord (featuredArticleSlugs), puis ranking métier par vues
  const featuredSlugs = siteConfig.homepage.featuredArticleSlugs || []
  const featured = featuredSlugs.map((slug) => bySlug.get(slug)).filter(Boolean)
  const featuredSet = new Set(featured.map((p) => p.slug))

  const business = withViews
    .filter((p) => isBusinessPost(p) && !featuredSet.has(p.slug))
    .sort((a, b) => b.views - a.views)

  if (featured.length + business.length >= limit) {
    return [...featured, ...business].slice(0, limit)
  }

  const fallback = withViews
    .filter(
      (p) =>
        !isLifestylePost(p) &&
        !featuredSet.has(p.slug) &&
        !business.some((b) => b.slug === p.slug)
    )
    .sort((a, b) => b.views - a.views)

  return [...featured, ...business, ...fallback].slice(0, limit)
}

function lightPost(post) {
  return {
    id: post.id || null,
    title: post.title || null,
    date: post.date || null,
    slug: post.slug || null,
    tags: post.tags || null,
    metaDescription: post.metaDescription || null,
    views: post.views || 0,
  }
}

function lightCaseStudy(cs) {
  return {
    slug: cs.slug,
    title: cs.title,
    description: cs.description,
    sector: cs.sector,
    views: cs.views || 0,
  }
}

/**
 * Cas d'usage featured depuis le fichier local (pas de Blob).
 */
function fetchFeaturedCaseStudies() {
  const featuredSlugs = siteConfig.homepage.featuredCaseStudySlugs || []
  const all = localCaseStudies || []
  const bySlug = new Map(all.map((cs) => [cs.slug, cs]))

  if (featuredSlugs.length > 0) {
    const selected = featuredSlugs
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map(lightCaseStudy)
    if (selected.length > 0) return selected
  }

  return all.slice(0, 3).map(lightCaseStudy)
}

/**
 * Récupère toutes les données home en parallèle (serveur).
 * @param {Array} posts - Liste des posts du blog
 * @returns {{ metrics, topPosts, topCaseStudies }}
 */
export async function fetchHomeData(posts = []) {
  const slugs = (posts || []).map((p) => p.slug).filter(Boolean)

  const [baseMetrics, keyResultsData, viewsMap, topCaseStudies] = await Promise.all([
    fetchMetrics(),
    fetchKeyResults(),
    slugs.length > 0 ? fetchBlogViewsMap() : Promise.resolve({}),
    Promise.resolve(fetchFeaturedCaseStudies()),
  ])

  const metrics = alignProjectsMetric(enrichMetricsWithKeyResults(baseMetrics, keyResultsData))
  const topPosts = selectTopBusinessPosts(posts, viewsMap, siteConfig.homepage.topPostsCount || 3).map(lightPost)

  const latestPost =
    [...(posts || [])]
      .filter((p) => p?.slug && p?.title)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 1)
      .map(lightPost)[0] || null

  return {
    metrics,
    // keyResults volontairement omis des props homepage (lourd, non affiché)
    topPosts,
    latestPost,
    topCaseStudies,
  }
}
