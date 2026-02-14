import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import { siteConfig } from '../lib/config'

export default function Custom404() {
  const quickLinks = [
    { href: '/', label: 'Accueil', description: 'Retour à la page d\'accueil' },
    { href: '/blog', label: 'Blog', description: 'Découvrir mes articles' },
    { href: '/marketplace', label: 'Marketplace', description: 'Outils gratuits et bases de données' },
    { href: '/cas-usage', label: 'Cas d\'usage', description: '6 500+ cas d\'usage scraping par secteur' },
    { href: '/a-propos', label: 'À propos', description: 'En savoir plus sur moi' },
    { href: '/objectifs', label: 'Objectifs 2026', description: 'Suivre mes objectifs' },
    { href: '/temoignages', label: 'Témoignages', description: 'Avis de mes clients' },
    { href: '/faq', label: 'FAQ', description: 'Questions fréquentes' },
    { href: '/contact', label: 'Contact', description: 'Me contacter' },
  ]

  return (
    <>
      <SEOHead
        title="Page non trouvée - 404"
        description="La page que vous recherchez n'existe pas ou a été déplacée. Retrouvez mes articles, outils et ressources."
        noindex={true}
      />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="text-center mb-12">
          <h1 className="font-semibold text-5xl mb-4 tracking-tighter">404</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-2">
            Page non trouvée
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Retour à l'accueil
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </Link>
        </section>

        {/* Liens rapides */}
        <section className="mb-12">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter text-center">
            Pages populaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors mb-1">
                      {link.label}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                      {link.description}
                    </p>
                  </div>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0 ml-2 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-600 dark:group-hover:text-neutral-400"
                  >
                    <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section recherche */}
        <section className="text-center p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-lg mb-3 tracking-tighter">
            Vous cherchez quelque chose de spécifique ?
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Explorez mon blog pour trouver des articles sur le scraping, l'automatisation et l'entrepreneuriat.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Voir tous les articles
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
            </svg>
          </Link>
        </section>
      </main>
    </>
  )
}








