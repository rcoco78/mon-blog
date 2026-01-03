import { useState, useEffect } from 'react'
import NewsletterForm from '../components/NewsletterForm'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import Link from 'next/link'

export default function NewsletterPage() {
  const [subscriberCount, setSubscriberCount] = useState(null)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/newsletter/count')
        const data = await response.json()
        setSubscriberCount(data.count)
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre d\'inscrits:', error)
      }
    }
    fetchCount()
  }, [])

  const pageSEO = generatePageSEO({
    title: 'Newsletter - Restez informé de mes articles | Corentin Robert',
    description: 'Inscrivez-vous à ma newsletter pour recevoir mes derniers articles sur le scraping, l\'automatisation et l\'entrepreneuriat. Rejoignez une communauté de professionnels passionnés.',
    path: '/newsletter',
    keywords: ['newsletter', 'inscription newsletter', 'articles scraping', 'automatisation', 'entrepreneuriat', 'community']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      {/* Structured Data */}
      <StructuredData type="Service" data={{
        name: 'Newsletter - Articles sur le scraping et l\'automatisation',
        description: 'Recevez mes derniers articles et réflexions directement dans votre boîte mail',
        provider: {
          '@type': 'Person',
          name: siteConfig.author,
          url: siteConfig.url
        },
        areaServed: 'FR',
        serviceType: 'Newsletter'
      }} />

      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-16">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Newsletter</h1>
          <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Rejoignez une communauté de professionnels passionnés par le scraping, l'automatisation et l'entrepreneuriat.
          </p>

          {/* Statistiques */}
          {subscriberCount !== null && (
            <div className="mb-8 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <strong className="text-neutral-900 dark:text-neutral-100">{subscriberCount}</strong> {subscriberCount === 1 ? 'personne' : 'personnes'} {subscriberCount === 1 ? 'est' : 'sont'} déjà inscrite{subscriberCount > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Bénéfices */}
          <div className="mb-8 space-y-4">
            <h2 className="font-semibold text-lg mb-4 tracking-tighter">Ce que vous recevrez</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">📧 Articles en avant-première</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Recevez mes nouveaux articles directement dans votre boîte mail, avant même qu'ils ne soient partagés sur les réseaux sociaux.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">💡 Cas d'usage concrets</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Découvrez comment j'ai résolu des problèmes réels de scraping et d'automatisation pour mes clients.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">🚀 Outils et ressources</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Accès en priorité à mes nouveaux outils gratuits et bases de données que je développe régulièrement.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">🎯 Contenu exclusif</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Réflexions sur l'entrepreneuriat, le freelance et mes apprentissages que je ne partage que par email.
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire d'inscription */}
          <div className="mb-8">
            <NewsletterForm compact={false} />
          </div>

          {/* Engagement */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Notre engagement</h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span><strong>Pas de spam</strong> — Maximum 1 email par semaine, uniquement pour les nouveaux articles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span><strong>Désinscription facile</strong> — Un clic dans chaque email pour vous désinscrire à tout moment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span><strong>Données protégées</strong> — Vos emails ne sont jamais partagés et sont stockés de manière sécurisée</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span><strong>Contenu de qualité</strong> — Seulement du contenu utile, pas de publicité</span>
              </li>
            </ul>
          </div>

          {/* Liens vers le blog */}
          <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              En attendant, découvrez mes derniers articles :
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
          </div>
        </section>
      </main>
    </>
  )
} 