import Link from 'next/link'
import HeroShot from '@/components/HeroShot'
import MenuCards from '@/components/MenuCards'
import ExplainVideo from '@/components/ExplainVideo'
import FaqList from '@/components/FaqList'
import JsonLd from '@/components/JsonLd'
import { FREE_ROWS, getScraper } from '@/lib/scrapers'
import {
  EXPLAIN_VIDEO,
  FAQS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  USE_CASES,
  WHYS,
} from '@/lib/site'

export const metadata = {
  title: {
    absolute: 'Datareacher — listes Airbnb, Instagram, entreprises',
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'fr_FR',
    type: 'website',
    siteName: SITE_NAME,
    images: [{ url: EXPLAIN_VIDEO.thumbnail, width: 960, height: 540, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [EXPLAIN_VIDEO.thumbnail],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'fr-FR',
    },
    {
      '@type': 'VideoObject',
      name: EXPLAIN_VIDEO.title,
      description: SITE_DESCRIPTION,
      embedUrl: EXPLAIN_VIDEO.embedUrl,
      thumbnailUrl: EXPLAIN_VIDEO.thumbnail,
      url: SITE_URL,
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ],
}

export default function HomePage() {
  const flagship = getScraper('airbnb-hosts')

  return (
    <div>
      <JsonLd data={jsonLd} />

      <section className="border-b border-line bg-wash/70">
        <div className="mx-auto grid max-w-site items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-xs uppercase tracking-widest text-mute">Listes pour entrepreneurs</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.1] text-ink sm:text-6xl">
              Tu prends ton shoot.
              <br />
              Tu repars.
            </h1>
            <p className="mt-6 max-w-md text-lg text-mute">
              Hôtes Airbnb, @ Instagram, entreprises, hôtels. {FREE_ROWS} lignes pour goûter. Tu emportes. Tu t’en vas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#gout"
                className="rounded-full bg-pine px-5 py-2.5 text-sm text-white hover:bg-pineHover"
              >
                Goûter {FREE_ROWS} lignes
              </a>
              <Link href="/scrapers" className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm hover:border-ink">
                Voir le menu
              </Link>
            </div>
            <p className="mt-4 text-sm text-mute">Sans compte. Sans carte. Pas d’abonnement.</p>
          </div>
          <div id="gout">
            <HeroShot scraper={flagship} />
          </div>
        </div>
      </section>

      <div className="border-b border-line bg-ink text-white">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-4 px-5 py-6">
          <p className="font-display text-xl">{FREE_ROWS} lignes offertes. Tu vois, ou tu t’en vas.</p>
          <a href="#gout" className="rounded-full bg-wash px-5 py-2 text-sm text-ink hover:bg-paper">
            Goûter maintenant
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-site px-5">
        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">Pourquoi les gens passent</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {WHYS.map((item) => (
              <div key={item.title}>
                <p className="font-display text-xl">{item.title}</p>
                <p className="mt-2 text-sm text-mute">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">Un endroit, toutes les listes</h2>
          <p className="mt-3 max-w-xl text-mute">
            Tu choisis une fiche. Tu colles une ville, une liste, un nom. Tu repars avec des lignes.
          </p>
          <div className="mt-10">
            <MenuCards featuredOnly />
          </div>
          <Link href="/scrapers" className="mt-8 inline-block text-sm underline">
            Tout le menu
          </Link>
        </section>

        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">Tu t’en sers pour</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((item) => (
              <div key={item.title} className="border-t border-line pt-4">
                <p className="font-display text-xl">{item.title}</p>
                <p className="mt-2 text-sm text-mute">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">Trois gestes</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            <div>
              <p className="font-display text-xl">1. Tu colles</p>
              <p className="mt-2 text-sm text-mute">Une ville, une liste, un nom. Le menu, un lien, ou la case à côté.</p>
            </div>
            <div>
              <p className="font-display text-xl">2. Tu goûtes</p>
              <p className="mt-2 text-sm text-mute">{FREE_ROWS} lignes. Sans compte. Tu vois si c’est ça.</p>
            </div>
            <div>
              <p className="font-display text-xl">3. Tu repars</p>
              <p className="mt-2 text-sm text-mute">Tu emportes la suite. On ne te retient pas.</p>
            </div>
          </div>
        </section>

        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">En quelques minutes</h2>
          <p className="mt-4 max-w-2xl text-mute">Tu n’as pas besoin d’un discours. Tu as besoin de voir.</p>
          <div className="mt-8">
            <ExplainVideo />
          </div>
        </section>

        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">Tu prends. Tu t’en vas.</h2>
          <p className="mt-3 max-w-xl text-mute">
            Pas d’abonnement. Ce qui ne sort pas, tu ne le paies pas.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="border border-line bg-paper p-6">
              <p className="font-display text-xl">Un shoot</p>
              <p className="mt-2 font-display text-3xl">20 €</p>
              <p className="mt-2 text-sm text-mute">Tu passes, tu prends, tu t’en vas.</p>
            </div>
            <div className="border border-pine bg-paper p-6">
              <p className="text-xs uppercase tracking-widest text-mute">Le plus pris</p>
              <p className="mt-2 font-display text-xl">La tournée</p>
              <p className="mt-1 font-display text-3xl">50 €</p>
              <p className="mt-2 text-sm text-mute">Tu as de quoi faire.</p>
            </div>
            <div className="border border-line bg-paper p-6">
              <p className="font-display text-xl">Le stock</p>
              <p className="mt-2 font-display text-3xl">150 €</p>
              <p className="mt-2 text-sm text-mute">Tu reviens dans la semaine.</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="mt-8 inline-block rounded-full bg-pine px-5 py-2.5 text-sm text-white hover:bg-pineHover"
          >
            Prendre un shoot
          </Link>
        </section>

        <section className="py-16">
          <h2 className="mb-8 font-display text-3xl text-ink">Questions</h2>
          <FaqList />
        </section>
      </div>

      <section className="border-t border-line bg-wash">
        <div className="mx-auto max-w-site px-5 py-16">
          <h2 className="font-display text-4xl text-ink">Une liste à sortir ce soir ?</h2>
          <p className="mt-4 max-w-xl text-mute">
            Tu colles. Tu goûtes {FREE_ROWS} lignes. Tu emportes, ou tu t’en vas. Personne ne te relance.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#gout" className="rounded-full bg-pine px-5 py-2.5 text-sm text-white hover:bg-pineHover">
              Goûter {FREE_ROWS} lignes
            </a>
            <Link href="/pricing" className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm hover:border-ink">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
