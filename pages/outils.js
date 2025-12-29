import Link from 'next/link'
import { useState, useEffect } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import FAQ from '../components/FAQ'
import SearchBar from '../components/SearchBar'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { tools } from '../lib/tools'

export default function Outils() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)

  const categories = ['Outreach', 'Scraping', 'Immobilier', 'Productivité']

  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === null || tool.category === selectedCategory
    return matchesCategory
  })

  const openCalendly = () => {
    // Charger Calendly seulement au premier clic (lazy load)
    if (!calendlyLoaded) {
      if (!document.querySelector('link[href*="calendly.com"]')) {
        const link = document.createElement('link')
        link.href = 'https://assets.calendly.com/assets/external/widget.css'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.type = 'text/javascript'
      script.async = true
      script.onload = () => {
        setCalendlyLoaded(true)
        if (window.Calendly) {
          window.Calendly.initPopupWidget({
            url: 'https://calendly.com/corentinrobert/20min'
          })
        }
      }
      document.body.appendChild(script)
    } else {
      if (window.Calendly) {
        window.Calendly.initPopupWidget({
          url: 'https://calendly.com/corentinrobert/20min'
        })
      }
    }
  }

  // Structured Data pour les outils
  const toolsStructuredData = {
    name: 'Outils Scraping et Automatisation Gratuits',
    description: 'Collection d\'outils gratuits pour automatiser vos processus business',
    numberOfItems: tools.length,
    items: tools.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        applicationCategory: 'BusinessApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR'
        },
        url: `${siteConfig.url}${tool.link}`
      }
    }))
  }

  // Structured Data pour FAQ
  const faqData = {
    questions: [
      {
        '@type': 'Question',
        name: 'Les outils sont-ils vraiment gratuits ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, tous les outils présentés sont entièrement gratuits. Je les développe pour partager mon expertise et aider la communauté. Certains outils peuvent avoir des limites d\'utilisation (comme l\'extracteur LinkedIn limité à 50 profils par jour).'
        }
      },
      {
        '@type': 'Question',
        name: 'Comment utiliser ces outils ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Chaque outil dispose de sa propre page avec des instructions d\'utilisation. Cliquez sur un outil pour accéder à sa page dédiée et commencer à l\'utiliser immédiatement, sans inscription nécessaire.'
        }
      },
      {
        '@type': 'Question',
        name: 'Puis-je avoir un outil sur-mesure ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolument ! Si vous avez besoin d\'un outil personnalisé pour votre business, je peux développer une solution sur-mesure adaptée à vos besoins spécifiques. Contactez-moi pour discuter de votre projet.'
        }
      }
    ]
  }

  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.outils.title,
    description: siteConfig.seo.pages.outils.description,
    path: '/outils',
    keywords: siteConfig.seo.pages.outils.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData type="ItemList" data={toolsStructuredData} />
      <StructuredData type="FAQPage" data={faqData} />
      <main className="min-w-0 mt-6 flex flex-col">
        <section className="mb-12">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Outils Scraping et Automatisation Gratuits
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 tracking-tight">
            Collection d'outils gratuits pour automatiser vos processus business, générer des leads et optimiser votre productivité.
          </p>
          <p className="text-neutral-700 dark:text-neutral-300 mb-8">
            Découvrez une collection d'<strong>outils scraping et automatisation gratuits</strong> développés pour répondre à des besoins business concrets. 
            Générateurs de templates, extracteurs de données, outils de productivité. 
            Tous ces outils sont <strong>100% gratuits</strong> et développés pour démontrer mon expertise en scraping et automatisation.
          </p>
          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center gap-2">
              <span className="relative flex h-2 w-2" title="Outils actifs">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {tools.length} outils disponibles
            </span>
          </div>
        </section>

        <section className="mb-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Pourquoi ces outils gratuits ?</h2>
          <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
            <p>
              Ces outils gratuits sont nés d'une <strong>philosophie du partage</strong>. 
              En tant que freelance scraping, je crois en la création de valeur pour la communauté. 
              Ces outils permettent de <strong>démontrer mon expertise pratique</strong> tout en aidant ceux qui en ont besoin.
            </p>
            <p>
              Chaque outil répond à un <strong>besoin business concret</strong> que j'ai rencontré dans mes projets. 
              En les partageant gratuitement, je contribue à la communauté tout en montrant ce que je sais faire. 
              C'est aussi une façon de créer du lien et de générer de la confiance.
            </p>
            <p>
              Si vous avez besoin d'un <strong>outil sur-mesure</strong> pour votre business, je peux développer une solution adaptée à vos besoins spécifiques.
            </p>
          </div>
      </section>

        <section className="mb-6">
          <SearchBar 
            tags={categories}
            selectedTag={selectedCategory}
            onTagSelect={setSelectedCategory}
          />
        </section>

        <section className="mb-12">
          <div className="flex flex-col space-y-4">
            {filteredTools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.link}
                className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group min-h-[96px]"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="flex-shrink-0 text-2xl">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                        {tool.name}
                      </h2>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        {tool.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Questions fréquentes</h2>
          <FAQ
            items={[
              {
                question: "Les outils sont-ils vraiment gratuits ?",
                answer: "Oui, tous les outils présentés sont entièrement gratuits. Je les développe pour partager mon expertise et aider la communauté. Certains outils peuvent avoir des limites d'utilisation (comme l'extracteur LinkedIn limité à 50 profils par jour)."
              },
              {
                question: "Comment utiliser ces outils ?",
                answer: "Chaque outil dispose de sa propre page avec des instructions d'utilisation. Cliquez sur un outil pour accéder à sa page dédiée et commencer à l'utiliser immédiatement, sans inscription nécessaire."
              },
              {
                question: "Puis-je avoir un outil sur-mesure ?",
                answer: "Absolument ! Si vous avez besoin d'un outil personnalisé pour votre business, je peux développer une solution sur-mesure adaptée à vos besoins spécifiques. Contactez-moi pour discuter de votre projet."
              }
            ]}
          />
        </section>

        <section className="mb-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Besoin d'un outil sur-mesure ?</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Si vous avez besoin d'un outil personnalisé pour votre business, je peux développer une solution adaptée à vos besoins spécifiques.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={openCalendly}
              className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Discutons de votre projet
            </button>
            <Link 
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Me contacter sur LinkedIn
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Pour aller plus loin</h2>
          <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <p>
              <Link href="/blog" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Lisez mes articles scraping
              </Link>
              {' • '}
              <Link href="/a-propos" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez mon expertise scraping
              </Link>
              {' • '}
              <Link href="/donnees-publiques" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Consultez mes métriques scraping
              </Link>
            </p>
          </div>
      </section>
    </main>
    </>
  )
} 