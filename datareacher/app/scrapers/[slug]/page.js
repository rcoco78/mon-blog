import { notFound } from 'next/navigation'
import ScraperRunner from '@/components/ScraperRunner'
import { getScraper, scrapers } from '@/lib/scrapers'

export function generateStaticParams() {
  return scrapers.map((item) => ({ slug: item.slug }))
}

export function generateMetadata({ params }) {
  const scraper = getScraper(params.slug)
  if (!scraper) return { title: 'Fiche' }
  return { title: scraper.name, description: scraper.promise }
}

export default function ScraperPage({ params }) {
  const scraper = getScraper(params.slug)
  if (!scraper) notFound()
  return <ScraperRunner scraper={scraper} />
}
