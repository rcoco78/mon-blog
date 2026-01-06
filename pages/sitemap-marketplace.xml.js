import { tools } from '../lib/tools'
import { getDatabasesAsTools } from '../lib/marketplace-databases'

const SitemapMarketplace = () => {}

export const getServerSideProps = async ({ res }) => {
  const baseUrl = 'https://www.corentinrobert.fr'
  const today = new Date().toISOString().split('T')[0]

  // Charger les outils statiques et les bases de données dynamiques
  let dynamicDatabases = []
  try {
    dynamicDatabases = await getDatabasesAsTools()
  } catch (error) {
    console.error('Erreur lors du chargement des bases de données pour le sitemap:', error)
    // Continuer avec les outils statiques uniquement
  }
  
  const allTools = [...(dynamicDatabases || []), ...tools]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allTools
    .filter((tool) => tool && tool.link) // Filtrer les outils sans lien
    .map((tool) => {
      return `
  <url>
    <loc>${baseUrl}${tool.link}</loc>
    <lastmod>${tool.date || today}</lastmod>
    <changefreq>weekly</changefreq>
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

export default SitemapMarketplace

