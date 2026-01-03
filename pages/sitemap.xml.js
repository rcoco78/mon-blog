import { getAllPosts } from '../lib/notion'
import { tools } from '../lib/tools'

const Sitemap = () => {}

export const getServerSideProps = async ({ res }) => {
  const baseUrl = 'https://www.corentinrobert.fr'
  const today = new Date().toISOString().split('T')[0]

  // Sitemap index
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-marketplace.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemapIndex)
  res.end()

  return {
    props: {},
  }
}

export default Sitemap 
