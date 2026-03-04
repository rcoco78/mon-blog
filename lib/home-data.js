/**
 * Fetch des données home en parallèle côté serveur (getStaticProps).
 * Évite les waterfalls côté client.
 */
import { list } from '@vercel/blob'
import { siteConfig } from './config'
import { getKeyResults } from './notion'
import { getCaseStudiesFromBlob } from './case-studies-blob'
import { caseStudies as localCaseStudies } from './case-studies'

const METRICS_FILENAME = 'metrics.json'
const KEY_RESULTS_FILENAME = 'key-results.json'
const BLOG_VIEWS_EVENTS = 'blog-views-events.json'
const CASE_STUDIES_VIEWS_EVENTS = 'case-studies-views-events.json'

async function fetchMetrics() {
  try {
    const blobs = await list({ prefix: METRICS_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === METRICS_FILENAME)
    if (blob) {
      const res = await fetch(blob.url, { next: { revalidate: 300 } })
      if (res.ok) {
        const data = await res.json()
        return data.metrics || siteConfig.metrics
      }
    }
  } catch (e) {
    console.warn('home-data: metrics fetch error', e.message)
  }
  return siteConfig.metrics
}

async function fetchKeyResults() {
  try {
    const blobs = await list({ prefix: KEY_RESULTS_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === KEY_RESULTS_FILENAME)
    if (blob) {
      const res = await fetch(blob.url, { next: { revalidate: 300 } })
      if (res.ok) {
        const data = await res.json()
        if (data.keyResults && Array.isArray(data.keyResults)) {
          return data.keyResults
        }
      }
    }
    return await getKeyResults()
  } catch (e) {
    console.warn('home-data: key-results fetch error', e.message)
  }
  return []
}

async function fetchBlogViewsMap() {
  try {
    const blobs = await list({ prefix: BLOG_VIEWS_EVENTS })
    const blob = blobs.blobs.find((b) => b.pathname === BLOG_VIEWS_EVENTS)
    if (blob) {
      const res = await fetch(blob.url, { next: { revalidate: 300 } })
      if (res.ok) {
        const events = await res.json()
        const arr = Array.isArray(events) ? events : []
        const map = {}
        arr.forEach((e) => {
          if (e.slug) map[e.slug] = (map[e.slug] || 0) + 1
        })
        return map
      }
    }
  } catch (e) {
    console.warn('home-data: blog views fetch error', e.message)
  }
  return {}
}

async function fetchTopCaseStudies(limit = 3) {
  try {
    const [eventsRes, caseStudiesRes] = await Promise.all([
      (async () => {
        const blobs = await list({ prefix: CASE_STUDIES_VIEWS_EVENTS })
        const blob = blobs.blobs.find((b) => b.pathname === CASE_STUDIES_VIEWS_EVENTS)
        if (blob) {
          const res = await fetch(blob.url, { next: { revalidate: 300 } })
          if (res.ok) {
            const data = await res.json()
            return Array.isArray(data) ? data : []
          }
        }
        return []
      })(),
      (async () => {
        try {
          return await getCaseStudiesFromBlob()
        } catch {
          return localCaseStudies || []
        }
      })(),
    ])

    const viewsMap = {}
    eventsRes.forEach((e) => {
      if (e.slug) viewsMap[e.slug] = (viewsMap[e.slug] || 0) + 1
    })

    const withViews = caseStudiesRes.map((cs) => ({
      ...cs,
      views: viewsMap[cs.slug] || 0,
    }))
    const sorted = withViews
      .sort((a, b) => {
        if (b.views !== a.views) return b.views - a.views
        return (a.title || '').localeCompare(b.title || '')
      })
      .slice(0, limit)

    return sorted.map((cs) => ({
      slug: cs.slug,
      title: cs.title,
      description: cs.description,
      sector: cs.sector,
      views: cs.views,
    }))
  } catch (e) {
    console.warn('home-data: top case studies error', e.message)
  }
  return []
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
    const caMetric = { value: `${fmt(Math.round(totalCA / 1000))}k €`, label: 'CA objectif 2026', source: 'au cumulé' }
    if (enriched.length >= 4) enriched[3] = caMetric
    else enriched.push(caMetric)
  }

  if (overallProgress > 0 && enriched.length < 4) {
    enriched.push({ value: `${overallProgress}%`, label: 'progression', source: 'objectifs 2026' })
  }

  return enriched.slice(0, 4)
}

/**
 * Récupère toutes les données home en parallèle (serveur).
 * @param {Array} posts - Liste des posts du blog
 * @returns {{ metrics, keyResults, topPosts, topCaseStudies }}
 */
export async function fetchHomeData(posts = []) {
  const slugs = (posts || []).map((p) => p.slug).filter(Boolean)
  const slugsParam = slugs.join(',')

  const [baseMetrics, keyResultsData, viewsMap, topCaseStudies] = await Promise.all([
    fetchMetrics(),
    fetchKeyResults(),
    slugsParam ? fetchBlogViewsMap() : Promise.resolve({}),
    fetchTopCaseStudies(3),
  ])

  const metrics = enrichMetricsWithKeyResults(baseMetrics, keyResultsData)

  const topPosts =
    posts && posts.length > 0
      ? posts
          .map((p) => ({ ...p, views: viewsMap[p.slug] || 0 }))
          .sort((a, b) => b.views - a.views)
          .slice(0, siteConfig.homepage.topPostsCount)
      : []

  return {
    metrics,
    keyResults: keyResultsData,
    topPosts,
    topCaseStudies,
  }
}
