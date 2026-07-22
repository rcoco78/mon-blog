import { useState, useEffect } from 'react'
import Link from 'next/link'
import NewsletterForm from '../components/NewsletterForm'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

const BENEFITS = [
  {
    title: 'Articles en avant-première',
    description:
      'Nouveaux articles scraping, automatisation et freelance, avant le partage public.',
  },
  {
    title: 'Cas d’usage concrets',
    description:
      'Comment j’ai résolu des problèmes réels de data et d’automatisation pour des clients.',
  },
  {
    title: 'Outils et ressources',
    description:
      'Priorité sur les nouveaux scrapers, bases marketplace et outils utiles.',
  },
  {
    title: 'Notes de terrain',
    description:
      'Apprentissages freelance et build in public que je ne partage pas toujours ailleurs.',
  },
]

export default function NewsletterPage() {
  const [subscriberCount, setSubscriberCount] = useState(null)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/newsletter/count')
        const data = await response.json()
        setSubscriberCount(data.count)
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre d\'inscrits:', error)
      }
    }
    fetchCount()
  }, [])

  const pageSEO = generatePageSEO({
    title: 'Newsletter — scraping, automatisation, freelance',
    description:
      'Recevez les articles métier sur le scraping, l’automatisation et le freelance. Pas de spam, désinscription en un clic.',
    path: '/newsletter',
    keywords: [
      'newsletter scraping',
      'newsletter automatisation',
      'freelance data',
      'articles scraping',
    ],
  })

  return (
    <>
      <SEOHead {...pageSEO} />

      <StructuredData
        type="Service"
        data={{
          name: 'Newsletter — scraping et automatisation',
          description:
            'Articles métier et notes de terrain sur le scraping, l’automatisation et le freelance.',
          provider: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url,
          },
          areaServed: 'FR',
          serviceType: 'Newsletter',
        }}
      />

      <main className="flex-auto min-w-0 mt-6 flex flex-col pb-16">
        <header className="mb-10">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">Newsletter</h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
            Scraping, automatisation et freelance — le même journal que sur le site, dans votre
            boîte mail.
          </p>
        </header>

        <div className="mb-12">
          <NewsletterForm compact={false} subscriberCount={subscriberCount} />
        </div>

        <section className="mb-12 border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Ce que vous recevez</h2>
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-200 dark:border-neutral-800">
            {BENEFITS.map((item) => (
              <li key={item.title} className="py-4">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{item.title}</p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12 border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Engagement</h2>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <li>— Maximum 1 email par semaine, uniquement du contenu utile</li>
            <li>— Désinscription en un clic</li>
            <li>— Emails jamais revendus ni partagés</li>
          </ul>
        </section>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          En attendant,{' '}
          <Link
            href="/blog"
            className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            lire les articles
          </Link>
          .
        </p>
      </main>
    </>
  )
}
