import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

export default function Open() {
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.open.title,
    description: siteConfig.seo.pages.open.description,
    path: '/open',
    keywords: siteConfig.seo.pages.open.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section>
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Projets Open Source</h1>
          <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">
            Découvrez mes projets open source et scrapers publics disponibles gratuitement.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Scrapers Apify</h2>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            Mes scrapers publics sur Apify, utilisés par plus de 150 utilisateurs actifs.
          </p>
          <div className="space-y-4">
            <a 
              href="https://apify.com/corent1robert"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
            >
              <div>
                <h3 className="font-medium mb-1">Voir tous mes scrapers</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  20 scrapers publics • 154 utilisateurs • 97.3% de taux de succès
                </p>
              </div>
              <div className="flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                </svg>
              </div>
            </a>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Code Source</h2>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            Projets open source disponibles sur GitHub.
          </p>
          <div className="space-y-4">
            <a 
              href="https://github.com/rcoco78"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
            >
              <div>
                <h3 className="font-medium mb-1">GitHub Profile</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Découvrez mes repositories publics et contributions
                </p>
              </div>
              <div className="flex items-center transition-all group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                </svg>
              </div>
            </a>
          </div>
        </section>
      </main>
    </>
  )
}

