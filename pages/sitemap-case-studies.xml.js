import { caseStudies } from '../lib/case-studies'

const SitemapCaseStudies = () => {}

export const getServerSideProps = async ({ res }) => {
  const baseUrl = 'https://www.corentinrobert.fr'
  const today = new Date().toISOString().split('T')[0]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/cas-usage</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ${caseStudies
    .map((cs) => {
      return `
  <url>
    <loc>${baseUrl}/cas-usage/${cs.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    })
    .join('')}
</urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default SitemapCaseStudies

