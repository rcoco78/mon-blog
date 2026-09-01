import Link from 'next/link'
import ScraperList from '@/components/ScraperList'
import ExplainVideo from '@/components/ExplainVideo'
import FaqList from '@/components/FaqList'
import JsonLd from '@/components/JsonLd'
import { FREE_ROWS } from '@/lib/scrapers'
import { EXPLAIN_VIDEO, FAQS, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site'

export const metadata = {
  title: {
    absolute: `${SITE_NAME} — des listes, tu prends, tu repars`,
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
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
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
  return (
    <div>
      <JsonLd data={jsonLd} />

      <section className="border-b border-line bg-wash/70">
        <div className="mx-auto max-w-site px-5 py-20">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-widest text-mute">Listes pour entrepreneurs</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.1] text-ink sm:text-6xl">
              Tu prends ton shoot.
              <br />
              Tu repars.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-mute">
              Datareacher, c’est des listes. Hôtes Airbnb, @ Instagram, entreprises France, hôtels. Tu arrives, tu
              goûtes {FREE_ROWS} lignes, tu emportes la suite, tu t’en vas. Pas d’abonnement. Pas de rendez-vous.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/s/airbnb-hosts"
                className="rounded-full bg-pine px-5 py-2.5 text-sm text-white hover:bg-pineHover"
              >
                Goûter un shoot
              </Link>
              <Link href="/scrapers" className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm hover:border-ink">
                Voir le menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-site px-5">
        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">En quelques minutes</h2>
          <p className="mt-4 max-w-2xl text-mute">
            Tu n’as pas besoin d’un discours. Tu as besoin de voir ce que c’est. Ensuite tu prends, ou tu t’en vas.
          </p>
          <div className="mt-8">
            <ExplainVideo />
          </div>
        </section>

        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">C’est pour qui</h2>
          <p className="mt-3 max-w-2xl text-mute">
            Pour quelqu’un qui vend, qui lance, qui vérifie. Pas pour une équipe qui cherche un logiciel à déployer.
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            <div>
              <p className="font-display text-xl">Tu prospectes</p>
              <p className="mt-2 text-sm text-mute">
                Une ville d’hôtes. Une liste d’entreprises. Des contacts, quand ils sont publics. Tu les emportes.
              </p>
            </div>
            <div>
              <p className="font-display text-xl">Tu lances quelque chose</p>
              <p className="mt-2 text-sm text-mute">
                Un @ libre. Un hôtel. Un deal. Tu vérifies, tu prends, tu repars à ton affaire.
              </p>
            </div>
            <div>
              <p className="font-display text-xl">Tu as besoin d’une liste ce soir</p>
              <p className="mt-2 text-sm text-mute">
                Pas un fichier d’il y a six mois. Tu sors ce qu’il te faut, maintenant.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">Comment ça marche</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            <div>
              <p className="font-display text-xl">1. Tu choisis</p>
              <p className="mt-2 text-sm text-mute">
                Une fiche du menu. Un lien. Une recherche. Tu colles une ville, une liste, un nom.
              </p>
            </div>
            <div>
              <p className="font-display text-xl">2. Tu goûtes</p>
              <p className="mt-2 text-sm text-mute">
                {FREE_ROWS} lignes. Sans compte. Sans carte. Tu vois si c’est ce que tu voulais.
              </p>
            </div>
            <div>
              <p className="font-display text-xl">3. Tu repars</p>
              <p className="mt-2 text-sm text-mute">
                Tu emportes la suite. Un shoot, une tournée, un stock. On ne te retient pas.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-line py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-ink">Le menu</h2>
              <p className="mt-3 max-w-xl text-mute">
                Airbnb, Instagram, Booking, entreprises France. Tu prends ce dont tu as besoin.
              </p>
            </div>
            <Link href="/scrapers" className="text-sm underline">
              Tout voir
            </Link>
          </div>
          <ScraperList grouped />
        </section>

        <section className="border-b border-line py-16">
          <h2 className="font-display text-3xl text-ink">Tu prends. Tu t’en vas.</h2>
          <p className="mt-3 max-w-xl text-mute">
            Pas d’abonnement. Ce qui ne sort pas, tu ne le paies pas. Les {FREE_ROWS} premières lignes, c’est pour
            goûter.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="border border-line bg-cream p-6">
              <p className="font-display text-xl">Un shoot</p>
              <p className="mt-2 font-display text-3xl">20 €</p>
              <p className="mt-2 text-sm text-mute">Tu passes, tu prends, tu t’en vas.</p>
            </div>
            <div className="border border-pine bg-cream p-6">
              <p className="text-xs uppercase tracking-widest text-mute">Le plus pris</p>
              <p className="mt-2 font-display text-xl">La tournée</p>
              <p className="mt-1 font-display text-3xl">50 €</p>
              <p className="mt-2 text-sm text-mute">Tu as de quoi faire.</p>
            </div>
            <div className="border border-line bg-cream p-6">
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
    </div>
  )
}
