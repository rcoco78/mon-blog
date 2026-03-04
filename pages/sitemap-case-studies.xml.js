import { getCaseStudiesFromBlob, getAllSectors as getAllSectorsFromBlob } from '../lib/case-studies-blob'
import { caseStudies as localCaseStudies, getAllSectors as getAllSectorsLocal } from '../lib/case-studies'
import { sectorToSlug } from '../lib/case-studies-helpers'
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'case-studies-views-events.json'

async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data) ? data : []
      }
    }
    return []
  } catch (error) {
    console.warn('Erreur lors de la récupération des événements de vues pour sitemap:', error)
    return []
  }
}

const SitemapCaseStudies = () => {}

export const getServerSideProps = async ({ res }) => {
  const baseUrl = 'https://www.corentinrobert.fr'
  const today = new Date().toISOString().split('T')[0]
  const now = Date.now()
  const DAY_MS = 86_400_000

  // Charger la liste des cas d'usage depuis Blob Storage (avec fallback local)
  let caseStudies = []
  try {
    caseStudies = await getCaseStudiesFromBlob()
  } catch (error) {
    console.warn('⚠️ Erreur lors du chargement des case studies depuis Blob pour le sitemap, fallback local:', error.message)
    caseStudies = localCaseStudies || []
  }

  // Vérification de sécurité
  if (!caseStudies || !Array.isArray(caseStudies) || caseStudies.length === 0) {
    console.error('❌ caseStudies est undefined ou vide dans sitemap')
    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    res.write(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/cas-usage</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`)
    res.end()
    return { props: {} }
  }

  // Récupérer la liste des secteurs depuis Blob (avec fallback)
  let sectors = []
  try {
    sectors = await getAllSectorsFromBlob()
  } catch (error) {
    console.warn('⚠️ Erreur lors du chargement des secteurs depuis Blob pour le sitemap, fallback local:', error.message)
    sectors = getAllSectorsLocal()
  }

  // Calculer les vues pour optimiser les priorités
  let viewsMap = {}
  try {
    const events = await getViewEvents()
    events.forEach(event => {
      if (event.slug) {
        viewsMap[event.slug] = (viewsMap[event.slug] || 0) + 1
      }
    })
  } catch (error) {
    console.warn('Erreur lors du calcul des vues pour sitemap:', error)
  }

  const caseStudiesWithViews = caseStudies.map(cs => ({
    ...cs,
    views: viewsMap[cs.slug] || 0
  })).sort((a, b) => b.views !== a.views ? b.views - a.views : a.title.localeCompare(b.title))

  const top3Slugs = new Set(caseStudiesWithViews.slice(0, 3).map(cs => cs.slug))
  const top10Slugs = new Set(caseStudiesWithViews.slice(0, 10).map(cs => cs.slug))

  // Helper : vraie date de dernière modification
  const getLastmod = (cs) => {
    const candidates = [
      cs.lastSeoOptimized,  // optimisation CTR la plus récente
      cs.updatedAt,
      cs.createdAt,
    ].filter(Boolean)
    if (candidates.length === 0) return today
    const latest = candidates.reduce((max, d) => new Date(d) > new Date(max) ? d : max)
    return new Date(latest).toISOString().split('T')[0]
  }

  // Helper : priorité et changefreq selon fraîcheur + popularité
  const getMeta = (cs) => {
    const ageMs = cs.createdAt ? now - new Date(cs.createdAt).getTime() : Infinity
    const isNew = ageMs < 7 * DAY_MS        // < 7 jours
    const isRecent = ageMs < 30 * DAY_MS    // < 30 jours
    const isPopular = top3Slugs.has(cs.slug)
    const isTop10 = top10Slugs.has(cs.slug)

    if (isNew) return { priority: '0.9', changefreq: 'daily' }
    if (isPopular) return { priority: '0.9', changefreq: 'weekly' }
    if (isRecent || isTop10) return { priority: '0.8', changefreq: 'weekly' }
    return { priority: '0.7', changefreq: 'monthly' }
  }

  // URLs des pages par secteur — lastmod = page la plus récente du secteur
  const sectorLastmod = {}
  for (const cs of caseStudies) {
    const s = cs.sector
    const d = getLastmod(cs)
    if (!sectorLastmod[s] || d > sectorLastmod[s]) sectorLastmod[s] = d
  }

  const sectorUrls = sectors
    .map((sector) => {
      const sectorSlug = sectorToSlug(sector)
      const lastmod = sectorLastmod[sector] || today
      return `
  <url>
    <loc>${baseUrl}/cas-usage/${sectorSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })
    .join('')

  const caseStudyUrls = caseStudies
    .map((cs) => {
      const sectorSlug = sectorToSlug(cs.sector)
      const lastmod = getLastmod(cs)
      const { priority, changefreq } = getMeta(cs)
      return `
  <url>
    <loc>${baseUrl}/cas-usage/${sectorSlug}/${cs.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/cas-usage</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${sectorUrls}${caseStudyUrls}
</urlset>`

  // Cache 1h côté CDN — assez frais pour Googlebot, pas trop de charge
  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  res.write(sitemap)
  res.end()

  return { props: {} }
}

export default SitemapCaseStudies

