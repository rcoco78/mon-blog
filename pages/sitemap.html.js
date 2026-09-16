import { getAllPosts } from '../lib/notion'
import Head from 'next/head'
import Link from 'next/link'

export default function Sitemap({ posts }) {
  return (
    <>
      <Head>
        <title>Plan du site | Corentin Robert</title>
        <meta name="description" content="Plan du site de Corentin Robert - Blog sur le growth hacking, le scraping et l'immobilier de luxe" />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <header className="mb-10">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Plan du site</h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
            Les pages du journal, les projets et les textes publiés.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="font-semibold text-xl mb-5 tracking-tighter">Pages principales</h2>
          <ul className="journal-rule">
            {[
              ['Accueil', '/'],
              ['Journal', '/blog'],
              ['Objectifs 2026', '/objectifs'],
              ['Marketplace', '/marketplace'],
              ['À propos', '/a-propos'],
              ['Contact', '/contact'],
              ['Confidentialité', '/confidentialite'],
            ].map(([label, href]) => (
              <li key={href} className="py-3 journal-rule">
                <Link href={href} className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-semibold text-xl mb-5 tracking-tighter">Articles du journal</h2>
          <div className="journal-rule">
            {posts.map((post) => (
              <article key={post.id} className="py-3 journal-rule">
                <Link 
                  href={`/blog/${post.slug}`}
                  className="font-medium hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {post.title}
                </Link>
                <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-1 tabular-nums">
                  {new Date(post.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-semibold text-xl mb-5 tracking-tighter">Outils</h2>
          <ul className="journal-rule">
            <li className="py-3 journal-rule">
              <Link href="/outils/email-generator" className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100">
                Générateur de modèles d&apos;emails
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  )
}

export async function getStaticProps() {
  const posts = await getAllPosts()
  return {
    props: {
      posts
    },
    revalidate: 60 * 60 // Revalidate every hour
  }
} 