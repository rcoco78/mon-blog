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
import { openCalendlyPopup } from '../lib/calendly'
import { captureCta } from '../lib/posthog-client'
import { FLOW } from '../lib/posthog-events'
import { displayPostTitle } from '../lib/post-title'
import { formatFrenchDate } from '../lib/format-date'

const DOORS = [
  siteConfig.network.datareacher,
  siteConfig.network.outreacher,
  siteConfig.network.immoreacher,
  siteConfig.network.marketplace,
  siteConfig.network.logement,
]

/** Fonction + méthode, dans le même ordre de phrase. Logement Atypique reprend sa description + le volume. */
const DOOR_LINES = {
  datareacher: {
    fn: 'Données et scripts.',
    method: 'Je scrappe, je livre la liste.',
  },
  outreacher: {
    fn: 'Outbound.',
    method: 'Je monte la campagne, tu appuies sur envoi.',
  },
  immoreacher: {
    fn: 'La liste du matin.',
    method: 'Mandataires et agences, à jour chaque jour.',
  },
  marketplace: {
    fn: 'Fichiers Sheets B2B.',
    method: 'Tu choisis, tu paies.',
  },
}

function doorCaption(door, metrics) {
  const lines = DOOR_LINES[door.id]
  if (lines) return `${lines.fn} ${lines.method}`
  if (door.id !== 'logement-atypique') return null
  const volume = (metrics || []).find(
    (metric) =>
      metric?.source === 'Logement Atypique' ||
      String(metric?.label || '').toLowerCase().includes('abonné')
  )
  const volumeText = volume?.value && volume?.label ? `${volume.value} ${volume.label}.` : null
  return [door.description, volumeText].filter(Boolean).join(' ') || null
}

const WORD_LINK =
  'underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 hover:text-neutral-900 dark:hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100 transition-colors'

function DoorMark({ door }) {
  if (!door?.icon) return null
  return (
    <span
      className={`mt-0.5 inline-flex w-6 h-6 shrink-0 items-center justify-center overflow-hidden ${
        door.iconShape === 'round' ? '' : 'rounded-md'
      } ${door.iconOnDark === 'plate' ? 'dark:bg-white dark:p-[3px]' : ''}`}
    >
      <img
        src={door.icon}
        alt=""
        width={24}
        height={24}
        className={`w-full h-full ${
          door.iconShape === 'round' ? 'rounded-full object-cover' : 'rounded-md object-contain'
        }`}
      />
    </span>
  )
}

export default function Home({ homeData }) {
  const latestPosts = homeData?.latestPosts ?? homeData?.topPosts ?? []
  const metrics = homeData?.metrics ?? siteConfig.metrics
  const projectsPhrase = getProjectsCountPhrase(metrics)
  const openCalendly = () => openCalendlyPopup('home')

  const pageSEO = generatePageSEO({
    title: 'Journal — data, outbound, ce que je construis',
    description: `Corentin Robert. Journal public. ${projectsPhrase} livrés via Malt et Fiverr. Datareacher, Outreacher, Immoreacher, marketplace, Logement Atypique.`,
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
          description: `Corentin Robert. Journal public. ${projectsPhrase} livrés. Datareacher, Outreacher, Immoreacher, marketplace, Logement Atypique.`,
          knowsAbout: ['Web Scraping', 'Data', 'Outbound', 'Automatisation'],
          sameAs: [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            siteConfig.social.fiverr,
            siteConfig.social.github,
            siteConfig.network.datareacher.href,
            siteConfig.network.outreacher.href,
            siteConfig.network.immoreacher.href,
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

      <main className="flex-auto min-w-0 mt-6 flex flex-col mb-8">
        <header>
          <LookAtAvatar
            src={siteConfig.profileImage}
            alt="Photo de profil de Corentin Robert"
            size={72}
            objectPosition="center 28%"
            lookBasePath={siteConfig.profileLook?.basePath}
            lookDirections={siteConfig.profileLook?.directions || []}
            lookExt={siteConfig.profileLook?.ext || 'jpg'}
            showRing
          />

          <h1 className="font-semibold text-2xl mb-3 tracking-tighter text-balance">Corentin Robert</h1>
          <p className="text-neutral-800 dark:text-neutral-200 tracking-tight">
            {siteConfig.homepage.positioning}
          </p>
          <p className="mt-4">
            <button
              type="button"
              onClick={openCalendly}
              className={`inline-flex items-center min-h-11 text-neutral-900 dark:text-neutral-100 ${WORD_LINK}`}
            >
              Réserver un appel
            </button>
          </p>
        </header>

        <section className="journal-rule mt-8 pt-6" aria-labelledby="home-projets">
          <h2 id="home-projets" className="font-semibold text-xl tracking-tighter mb-1">
            Ce que je construis
          </h2>
          <ul>
            {DOORS.map((door) => {
              const caption = doorCaption(door, metrics)
              const name = (
                <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
                  {door.title}
                </span>
              )
              return (
                <li key={door.id} className="py-4 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                  <div className="flex items-start gap-3">
                    <DoorMark door={door} />
                    <div className="min-w-0">
                      {door.external ? (
                        <a
                          href={door.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            captureCta({ flow: FLOW.journal, source: 'home_doors', cta: door.id })
                          }
                          className={WORD_LINK}
                        >
                          {name}
                        </a>
                      ) : (
                        <Link
                          href={door.href}
                          onClick={() =>
                            captureCta({ flow: FLOW.journal, source: 'home_doors', cta: door.id })
                          }
                          className={WORD_LINK}
                        >
                          {name}
                        </Link>
                      )}
                      {caption ? (
                        <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 tracking-tight">
                          {caption}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="journal-rule mt-8 pt-6" aria-labelledby="home-textes">
          <h2 id="home-textes" className="font-semibold text-xl tracking-tighter mb-1">
            Derniers textes
          </h2>
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => {
              const dateLabel = formatFrenchDate(post.date) || null
              return (
                <ContentListRow
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  title={displayPostTitle(post)}
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
          <p className="mt-4">
            <Link href="/blog" className={`text-sm text-neutral-800 dark:text-neutral-200 ${WORD_LINK}`}>
              Tous les textes
            </Link>
          </p>
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
