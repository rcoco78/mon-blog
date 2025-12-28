import { useEffect } from 'react'
import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import { siteConfig } from '../lib/config'

function Error({ statusCode }) {
  useEffect(() => {
    // Log l'erreur pour le debugging (seulement en développement)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error page rendered:', { statusCode })
    }
  }, [statusCode])

  return (
    <>
      <SEOHead
        title="Erreur"
        description="Une erreur s'est produite. Veuillez réessayer plus tard."
        noindex={true}
      />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="text-center">
          <h1 className="font-semibold text-4xl mb-4 tracking-tighter">
            {statusCode ? `Erreur ${statusCode}` : 'Une erreur est survenue'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            {statusCode === 404
              ? "La page que vous recherchez n'existe pas."
              : statusCode === 500
              ? "Une erreur serveur s'est produite. Veuillez réessayer plus tard."
              : "Une erreur inattendue s'est produite."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Retour à l'accueil
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-3 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </section>
      </main>
    </>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error

