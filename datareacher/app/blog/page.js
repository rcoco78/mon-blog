import Link from 'next/link'

export const metadata = { title: 'Blog' }

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-serif text-4xl">Blog</h1>
      <p className="mt-4 text-mute">
        Uniquement du produit — pas le journal perso. Une vidéo YouTube peut renvoyer ici, le CTA reste la fiche scraper.
      </p>
      <article className="mt-12 border-t border-line pt-8">
        <p className="text-xs uppercase tracking-widest text-mute">Exemple de format</p>
        <h2 className="mt-2 font-serif text-2xl">Emails d’hôtes Airbnb d’une ville</h2>
        <p className="mt-3 text-mute">
          Tu lances, tu vois 20 lignes, tu paies la suite. Pas un fichier à 180 €.
        </p>
        <Link href="/s/airbnb-hosts" className="mt-4 inline-block text-sm underline">
          Essayer le scraper
        </Link>
      </article>
    </div>
  )
}
