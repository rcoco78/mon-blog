import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { testimonials } from '../lib/testimonials'

const malt = siteConfig.socialProof.malt

export default function Temoignages() {
  const sorted = [...testimonials].sort(
    (a, b) => new Date(b.datePublished) - new Date(a.datePublished)
  )

  const pageSEO = generatePageSEO({
    title: 'Témoignages clients',
    description: `Avis clients — ${malt.rating}/5 sur Malt (${malt.reviews} avis), ${malt.projects} projets livrés. Sélection d’avis publics Malt, Fiverr et LinkedIn.`,
    path: '/temoignages',
    keywords: ['témoignages', 'avis clients', 'recommandations', 'Malt', 'Fiverr', 'LinkedIn'],
  })

  return (
    <>
      <SEOHead {...pageSEO} />

      <StructuredData
        type="AggregateRating"
        data={{
          ratingValue: String(malt.rating),
          reviewCount: String(malt.reviews),
          bestRating: '5',
          worstRating: '1',
        }}
      />

      {sorted.map((testimonial, index) => (
        <StructuredData
          key={`${testimonial.authorName}-${testimonial.datePublished}-${index}`}
          type="Review"
          data={{
            author: {
              '@type': 'Person',
              name: testimonial.authorName,
            },
            reviewBody: testimonial.reviewBody,
            ratingValue: testimonial.ratingValue,
            datePublished: testimonial.datePublished,
            itemReviewed: {
              '@type': 'Service',
              name: 'Services de scraping et automatisation',
              url: siteConfig.url,
              provider: {
                '@type': 'Person',
                name: siteConfig.author,
                url: siteConfig.url,
              },
            },
          }}
        />
      ))}

      <main className="flex-auto min-w-0 mt-6 flex flex-col pb-16">
        <header className="mb-10">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">Témoignages</h1>
          <p className="text-neutral-800 dark:text-neutral-200 tracking-tight font-medium">
            {malt.rating}/5 sur Malt · {malt.reviews} avis · {malt.projects} projets
          </p>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Chiffres du profil{' '}
            <a
              href={siteConfig.social.malt}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Malt
            </a>
            . Ci-dessous, une sélection d’avis publics Malt, Fiverr et LinkedIn.
          </p>
        </header>

        <section aria-label="Liste des témoignages">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-neutral-200 dark:border-neutral-800">
            {sorted.map((t, i) => {
              const dateLabel = t.datePublished
                ? new Date(t.datePublished).toLocaleDateString('fr-FR', {
                    month: 'short',
                    year: 'numeric',
                  })
                : null
              return (
                <blockquote
                  key={`${t.authorName}-${t.datePublished}-${i}`}
                  className="py-5"
                >
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    « {t.reviewBody} »
                  </p>
                  <footer className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-500">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {t.authorName}
                    </span>
                    {t.authorJob && <span>{t.authorJob}</span>}
                    {t.source && <span>{t.source}</span>}
                    {dateLabel && <span>{dateLabel}</span>}
                  </footer>
                </blockquote>
              )
            })}
          </div>
        </section>

        <section className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
          <p>
            Tous les avis Malt :{' '}
            <a
              href={siteConfig.social.malt}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              malt.fr/profile/growth
            </a>
            {' · '}
            aussi sur{' '}
            <a
              href={siteConfig.social.fiverr}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Fiverr
            </a>
            {' et '}
            <a
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              LinkedIn
            </a>
            .
          </p>
          <p>
            <Link
              href="/contact"
              className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Discuter d’un projet
            </Link>
          </p>
        </section>
      </main>
    </>
  )
}
