import { caseStudies, getAllSectors } from '../lib/case-studies'
import { sectorToSlug } from '../lib/case-studies-helpers'

const SitemapCaseStudies = () => {}

export const getServerSideProps = async ({ res }) => {
  const baseUrl = 'https://www.corentinrobert.fr'
  const today = new Date().toISOString().split('T')[0]
  const sectors = getAllSectors()

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

  // URLs des case studies individuels avec secteur
  const caseStudyUrls = caseStudies
    .map((cs) => {
      const sectorSlug = sectorToSlug(cs.sector)
      return `
  <url>
    <loc>${baseUrl}/cas-usage/${sectorSlug}/${cs.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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

