import { getAllPosts } from '../lib/notion'
import { fetchBlobJson } from '../lib/blob-cache'

const SitemapBlog = () => {}

export const getServerSideProps = async ({ res }) => {
  let posts = []

  try {
    const data = await fetchBlobJson('blog-posts.json')
    if (data?.posts && Array.isArray(data.posts)) {
      posts = data.posts
    }
  } catch {
    // fallback Notion
  }

  if (posts.length === 0) {
    posts = await getAllPosts()
  }

  const baseUrl = 'https://www.corentinrobert.fr'

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${posts
    .map((post) => {
      const lastmod = post.lastEdited || post.date
      const lastmodIso = lastmod
        ? new Date(lastmod).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      return `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmodIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    })
    .join('')}
</urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default SitemapBlog
