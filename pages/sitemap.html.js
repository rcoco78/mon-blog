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

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Plan du site</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Pages principales</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-blue-600 hover:text-blue-800">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/marketplace" className="text-blue-600 hover:text-blue-800">
                Outils gratuits
              </Link>
            </li>
            <li>
              <Link href="/temoignages" className="text-blue-600 hover:text-blue-800">
                Témoignages
              </Link>
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Articles du blog</h2>
          <div className="grid gap-4">
            {posts.map((post) => (
              <div key={post.id} className="border-b pb-4">
                <Link 
                  href={`/blog/${post.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {post.title}
                </Link>
                <p className="text-gray-600 text-sm mt-1">
                  {new Date(post.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Outils gratuits</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/outils/generateur-templates-emails" className="text-blue-600 hover:text-blue-800">
                Générateur de Templates d'Emails
              </Link>
            </li>
            {/* Ajoutez d'autres outils ici */}
          </ul>
        </section>
      </div>
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