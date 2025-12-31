import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import { siteConfig } from '../lib/config'

export default function Custom404() {
  return (
    <>
      <SEOHead
        title="Page non trouvée"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        noindex={true}
      />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="text-center">
          <h1 className="font-semibold text-4xl mb-4 tracking-tighter">404</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </section>
      </main>
    </>
  )
}






