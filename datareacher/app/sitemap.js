import { scrapers } from '@/lib/scrapers'
import { SITE_URL } from '@/lib/site'

export default function sitemap() {
  const now = new Date()
  const pages = ['', '/scrapers', '/pricing', '/docs', '/blog', '/legal/cgu', '/legal/confidentialite']
  const fiches = scrapers.flatMap((item) => [item.youtubePath, `/scrapers/${item.slug}`])

  return [...pages, ...fiches].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/s/') ? 0.8 : 0.6,
  }))
}
