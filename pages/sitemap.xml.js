import { getAllPosts } from '../lib/notion'

const Sitemap = () => {}

export const getServerSideProps = async ({ res }) => {
  const posts = await getAllPosts()
  const baseUrl = 'https://www.corentinrobert.fr'

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${baseUrl}/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      <url>
        <loc>${baseUrl}/outils</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${baseUrl}/temoignages</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
      ${posts
        .map((post) => {
          return `
            <url>
              <loc>${baseUrl}/blog/${post.slug}</loc>
              <lastmod>${post.date}</lastmod>
              <changefreq>monthly</changefreq>
              <priority>0.7</priority>
            </url>
          `
        })
        .join('')}
    </urlset>
  `

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default Sitemap 