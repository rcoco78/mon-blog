import Link from 'next/link'
import { useState, useEffect } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { tools } from '../lib/tools'

export default function Outils() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)

  const categories = ['Tous', 'Outreach', 'Scraping', 'Immobilier', 'Productivité']

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Tous' || tool.category === selectedCategory
    return matchesSearch && matchesCategory
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
            <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
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

        <section className="mb-12">
          <div className="mb-8 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un outil..."
                  className="w-full px-4 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute right-3 top-2.5 w-5 h-5 text-neutral-400 dark:text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    selectedCategory === category
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.link}
                className="group block p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tool.icon}</span>
                    <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                      {tool.name}
                      {tool.isNew && (
                        <span className="ml-2 text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 rounded-full">
                          Nouveau
                        </span>
                      )}
                    </h2>
                  </div>
                </div>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                  {tool.description}
                </p>
                <div className="mt-4 flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                    {tool.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Questions fréquentes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Les outils sont-ils vraiment gratuits ?</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Oui, tous les outils présentés sont entièrement gratuits. Je les développe pour partager mon expertise et aider la communauté. 
                Certains outils peuvent avoir des limites d'utilisation (comme l'extracteur LinkedIn limité à 50 profils par jour).
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Comment utiliser ces outils ?</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Chaque outil dispose de sa propre page avec des instructions d'utilisation. 
                Cliquez sur un outil pour accéder à sa page dédiée et commencer à l'utiliser immédiatement, sans inscription nécessaire.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Puis-je avoir un outil sur-mesure ?</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Absolument ! Si vous avez besoin d'un outil personnalisé pour votre business, je peux développer une solution sur-mesure adaptée à vos besoins spécifiques. 
                Contactez-moi pour discuter de votre projet.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12 text-center p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold text-xl mb-3 tracking-tighter">Besoin d'un outil sur-mesure ?</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Si vous avez besoin d'un outil personnalisé pour votre business, je peux développer une solution adaptée à vos besoins spécifiques.
          </p>
          <button
            onClick={openCalendly}
            className="inline-block px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Discutons de votre projet
          </button>
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