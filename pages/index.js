import Link from 'next/link'
import { getAllPosts } from '../lib/notion'
import { fetchHomeData } from '../lib/home-data'
import { siteConfig } from '../lib/config'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import LookAtAvatar from '../components/LookAtAvatar'
import { generatePageSEO } from '../lib/seo'
import ContentListRow from '../components/ContentListRow'
import { getProjectsCountPhrase } from '../lib/project-count'
import { captureDataError } from '../lib/sentry'
import { captureCta } from '../lib/posthog-client'
import { FLOW } from '../lib/posthog-events'

const DOORS = [
  siteConfig.network.datareacher,
  siteConfig.network.outreacher,
  siteConfig.network.blog,
  siteConfig.network.logement,
]

export default function Home({ homeData }) {
  const latestPosts = homeData?.latestPosts ?? homeData?.topPosts ?? []
  const latestPost = homeData?.latestPost ?? null
  const metrics = homeData?.metrics ?? siteConfig.metrics
  const projectsPhrase = getProjectsCountPhrase(metrics)

  const pageSEO = generatePageSEO({
    title: 'Journal — data, outbound, ce que je construis',
    description: `Corentin Robert. Journal public. ${projectsPhrase} livrés via Malt et Fiverr. Datareacher, Outreacher, Logement Atypique.`,
    path: '/',
    keywords: [
      'Corentin Robert',
      'journal scraping',
      'automatisation',
      'Datareacher',
      'Outreacher',
      'freelance scraping',
    ],
  })

  return (
    <>
      <SEOHead {...pageSEO} />

      <StructuredData
        type="Person"
        data={{
          name: 'Corentin Robert',
          jobTitle: 'Freelance scraping, data et outbound',
          description: `Corentin Robert. Journal public. ${projectsPhrase} livrés. Datareacher, Outreacher, Logement Atypique.`,
          knowsAbout: ['Web Scraping', 'Data', 'Outbound', 'Automatisation'],
          sameAs: [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            siteConfig.social.fiverr,
            siteConfig.social.github,
            siteConfig.network.datareacher.href,
            siteConfig.network.outreacher.href,
          ],
        }}
      />

      <StructuredData
        type="SiteNavigation"
        data={{
          items: [
            { name: 'Journal', url: `${siteConfig.url}/blog` },
            { name: 'À propos', url: `${siteConfig.url}/a-propos` },
            { name: 'Objectifs', url: `${siteConfig.url}/objectifs` },
            { name: 'Marketplace', url: `${siteConfig.url}/marketplace` },
          ],
        }}
      />

      <StructuredData
        type="WebPage"
        data={{
          url: siteConfig.url,
          name: 'Corentin Robert',
          title: 'Journal — data, outbound, ce que je construis',
          description: `Journal public de Corentin Robert. ${projectsPhrase} livrés.`,
          image: siteConfig.ogImage,
        }}
      />

      <main className="flex-auto min-w-0 mt-6 flex flex-col mb-0">
        <section aria-label="Présentation">
          <LookAtAvatar
            src={siteConfig.profileImage}
            alt="Photo de profil de Corentin Robert"
            size={96}
            objectPosition="center 28%"
            lookBasePath={siteConfig.profileLook?.basePath}
            lookDirections={siteConfig.profileLook?.directions || []}
            lookExt={siteConfig.profileLook?.ext || 'jpg'}
            showRing
          />

          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Corentin Robert</h1>
          <p className="mb-3 text-neutral-800 dark:text-neutral-200 tracking-tight font-medium">
            {siteConfig.homepage.positioning}
          </p>
          <p className="mb-3 text-neutral-600 dark:text-neutral-400 tracking-tight">
            D&apos;Airbnb et Shine à InstaNinja (environ 10K€ de MRR), puis aux missions
            freelance : je note ici ce que le terrain m&apos;apprend.
          </p>
          <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Aujourd&apos;hui, je construis Datareacher, Outreacher et Logement Atypique.
          </p>

          <div className="mb-10 journal-rule pt-5" aria-label="En ce moment">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-3">
              En ce moment
            </p>
            <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              {latestPost?.slug && (
                <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-neutral-500 dark:text-neutral-500 shrink-0">Article</span>
                  <Link
                    href={`/blog/${latestPost.slug}`}
                    className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    {latestPost.title}
                  </Link>
                </li>
              )}
              <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-neutral-500 dark:text-neutral-500 shrink-0">Objectifs</span>
                <Link
                  href="/objectifs"
                  onClick={() => captureCta({ flow: FLOW.journal, source: 'home_now', cta: 'objectifs' })}
                  className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  Progression 2026 en public
                </Link>
              </li>
            </ul>
          </div>
        </section>

        <section aria-label="Les portes du réseau">
          <h2 className="font-semibold text-xl mb-2 tracking-tighter">Ce que je construis et accompagne</h2>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Trois projets en cours, une collaboration et ce journal pour garder une trace.
          </p>
          <ul className="space-y-3 text-sm">
            {DOORS.map((door) => {
              const className =
                'underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors'
              const title = (
                <span className="text-neutral-900 dark:text-neutral-100 font-medium">{door.title}</span>
              )
              const icon = door.icon ? (
                <span
                  className={`inline-flex w-6 h-6 shrink-0 items-center justify-center overflow-hidden ${
                    door.iconShape === 'round' ? '' : 'rounded-md'
                  } ${door.iconOnDark === 'plate' ? 'dark:bg-white dark:p-[3px]' : ''}`}
                >
                  <img
                    src={door.icon}
                    alt=""
                    width={24}
                    height={24}
                    className={`w-full h-full ${
                      door.iconShape === 'round'
                        ? 'rounded-full object-cover'
                        : 'rounded-md object-contain'
                    }`}
                  />
                </span>
              ) : null
              return (
                <li key={door.id} className="flex items-center gap-3">
                  {icon}
                  <div className="min-w-0 flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-x-2 gap-y-0.5">
                    {door.external ? (
                      <a
                        href={door.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          captureCta({ flow: FLOW.journal, source: 'home_doors', cta: door.id })
                        }
                        className={className}
                      >
                        {title}
                      </a>
                    ) : (
                      <Link href="/blog" className={className}>
                        {title}
                      </Link>
                    )}
                    <span className="text-neutral-600 dark:text-neutral-400">{door.description}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mt-12 mb-8" aria-label="Derniers textes">
          <h2 className="font-semibold text-xl mb-2 tracking-tighter">Derniers textes</h2>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Le journal, dans l’ordre.
          </p>
          <div className="flex flex-col space-y-4">
            {latestPosts.length > 0 ? (
              latestPosts.map((post) => {
                const d = new Date(post.date)
                const dateLabel = Number.isNaN(d.getTime())
                  ? null
                  : d.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                return (
                  <ContentListRow
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    title={post.title}
                    meta={dateLabel}
                    description={post.metaDescription || null}
                    variant="list"
                  />
                )
              })
            ) : (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 py-4">
                Aucun texte pour le moment.
              </p>
            )}
          </div>
          <div className="mt-6">
            <Link
              href="/blog"
              className="text-sm font-normal text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors inline-flex items-center gap-1.5"
            >
              Tous les textes
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export async function getStaticProps() {
  const posts = await getAllPosts().catch((err) => {
    captureDataError(err, { source: 'notion', tags: { area: 'home-posts' } })
    return []
  })

  const homeData = await fetchHomeData(posts).catch((err) => {
    captureDataError(err, { source: 'blob', tags: { area: 'home-data' } })
    return null
  })

  return {
    props: { homeData },
    revalidate: 60,
  }
}
