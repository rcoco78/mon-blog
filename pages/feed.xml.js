import { getAllPosts } from '../lib/notion'
import { siteConfig } from '../lib/config'

const Feed = () => {}

export const getServerSideProps = async ({ res }) => {
  const posts = await getAllPosts()
  const baseUrl = siteConfig.url

  const rssItems = posts
    .slice(0, 50)
    .map((post) => {
      const url = `${baseUrl}/blog/${post.slug}`
      const pubDate = new Date(post.date).toUTCString()
      const description = post.metaDescription
        ? escapeXml(post.metaDescription)
        : `Article de ${siteConfig.author} : ${escapeXml(post.title)}`

      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description>${description}</description>
    <pubDate>${pubDate}</pubDate>
    ${post.tags?.length ? post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n    ') : ''}
  </item>`
    })
    .join('\n')

  const lastBuildDate = posts.length
    ? new Date(posts[0].date).toUTCString()
    : new Date().toUTCString()

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} - Blog</title>
    <link>${baseUrl}/blog</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>fr</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.write(rss)
  res.end()

  return { props: {} }
}

function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default Feed
