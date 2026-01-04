import { caseStudies, getAllSectors } from '../lib/case-studies'
import { sectorToSlug } from '../lib/case-studies-helpers'
import { list } from '@vercel/blob'

const VIEWS_EVENTS_FILENAME = 'case-studies-views-events.json'

async function getViewEvents() {
  try {
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

    if (existingBlob) {
      const response = await fetch(existingBlob.url, {
        method: 'GET',
        cache: 'no-store',
      })

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
  
  // Vérification de sécurité
  if (!caseStudies || !Array.isArray(caseStudies) || caseStudies.length === 0) {
    console.error('❌ caseStudies est undefined ou vide dans sitemap')
    res.setHeader('Content-Type', 'text/xml')
    res.write(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/cas-usage</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`)
    res.end()
    return { props: {} }
  }

  const sectors = getAllSectors()

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

  // Trier les cas d'usage par vues pour déterminer les priorités
  const caseStudiesWithViews = caseStudies.map(cs => ({
    ...cs,
    views: viewsMap[cs.slug] || 0
  })).sort((a, b) => {
    if (b.views !== a.views) {
      return b.views - a.views
    }
    return a.title.localeCompare(b.title)
  })

  // Déterminer les slugs populaires (top 3 = 0.9, top 10 = 0.8, autres = 0.7)
  const top3Slugs = new Set(caseStudiesWithViews.slice(0, 3).map(cs => cs.slug))
  const top10Slugs = new Set(caseStudiesWithViews.slice(0, 10).map(cs => cs.slug))

  // URLs des pages par secteur
  const sectorUrls = sectors
    .map((sector) => {
      const sectorSlug = sectorToSlug(sector)
      return `
  <url>
    <loc>${baseUrl}/cas-usage/${sectorSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })
    .join('')

  // URLs des case studies individuels avec secteur (priorités optimisées)
  const caseStudyUrls = caseStudies
    .map((cs) => {
      const sectorSlug = sectorToSlug(cs.sector)
      // Déterminer la priorité selon la popularité
      let priority = '0.7' // Par défaut
      if (top3Slugs.has(cs.slug)) {
        priority = '0.9' // Top 3
      } else if (top10Slugs.has(cs.slug)) {
        priority = '0.8' // Top 10
      }
      
      return `
  <url>
    <loc>${baseUrl}/cas-usage/${sectorSlug}/${cs.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/cas-usage</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>${sectorUrls}${caseStudyUrls}
</urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default SitemapCaseStudies

