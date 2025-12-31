import Link from 'next/link'
import Image from 'next/image'
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
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">
            Outils Scraping et Automatisation Gratuits
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight">
            Collection d'outils gratuits pour automatiser vos processus business, générer des leads et optimiser votre productivité. Découvrez une collection d'<strong className="text-neutral-900 dark:text-neutral-100">outils scraping et automatisation gratuits</strong> développés pour répondre à des besoins business concrets. Générateurs de templates, extracteurs de données, outils de productivité. Tous ces outils sont <strong className="text-neutral-900 dark:text-neutral-100">100% gratuits</strong> et développés pour démontrer mon expertise en scraping et automatisation.
          </p>
          <SearchBar 
            tags={categories}
            selectedTag={selectedCategory}
            onTagSelect={setSelectedCategory}
          />
        </section>

        <section className="mb-16">
          <div className="flex flex-col space-y-4">
          {filteredTools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.link}
                className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group min-h-[96px]"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {tool.iconSvg ? (
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                      {tool.iconSvg === 'email' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                          <path d="M8.47 1.318a1 1 0 0 0-.94 0l-6 3.2A1 1 0 0 0 1 5.4v.817l5.75 3.45L8 8.917l1.25.75L15 6.217V5.4a1 1 0 0 0-.53-.882zM15 7.383l-4.778 2.867L15 13.117zm-.035 6.88L8 10.082l-6.965 4.18A1 1 0 0 0 2 15h12a1 1 0 0 0 .965-.738ZM1 13.116l4.778-2.867L1 7.383v5.734ZM7.059.435a2 2 0 0 1 1.882 0l6 3.2A2 2 0 0 1 16 5.4V14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5.4a2 2 0 0 1 1.059-1.765z"/>
                        </svg>
                      )}
                      {tool.iconSvg === 'search' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                        </svg>
                      )}
                      {tool.iconSvg === 'house' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                          <path d="M8 6.982C9.664 5.309 13.825 8.236 8 12 2.175 8.236 6.336 5.309 8 6.982"/>
                          <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.707L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.646a.5.5 0 0 0 .708-.707L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
                        </svg>
                      )}
                      {tool.iconSvg === 'grid' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 2h-4v3h4zm0 4h-4v3h4zm0 4h-4v3h3a1 1 0 0 0 1-1zm-5 3v-3H6v3zm-5 0v-3H1v2a1 1 0 0 0 1 1zm-4-4h4V7H1zm0-4h4V3H1a1 1 0 0 0-1 1zm5 0v3h4V3zm4 4H6v3h4z"/>
                        </svg>
                      )}
                    </div>
                  ) : tool.icon && tool.icon.startsWith('/') ? (
                    <div className="flex-shrink-0 w-6 h-6">
                      <Image
                        src={tool.icon}
                        alt={`${tool.name} - ${tool.description}`}
                        width={24}
                        height={24}
                        loading="lazy"
                        className="w-6 h-6 rounded-lg object-contain"
                      />
                    </div>
                  ) : tool.icon ? (
                    <span className="flex-shrink-0 text-2xl">{tool.icon}</span>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                    {tool.name}
                  </h2>
                </div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 flex-1">
                        {tool.description}
                      </p>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0 mt-0.5 sm:hidden">
                        <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:block">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
            </Link>
          ))}
        </div>
      </section>

        <section className="mb-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Questions fréquentes</h2>
          <FAQ
            items={[
              {
                question: "Pourquoi ces outils gratuits ?",
                answer: (
                  <>
                    <p className="mb-3">
                      Ces outils gratuits sont nés d'une <strong>philosophie du partage</strong>. 
                      En tant que freelance scraping, je crois en la création de valeur pour la communauté. 
                      Ces outils permettent de <strong>démontrer mon expertise pratique</strong> tout en aidant ceux qui en ont besoin.
                    </p>
                    <p className="mb-3">
                      Chaque outil répond à un <strong>besoin business concret</strong> que j'ai rencontré dans mes projets. 
                      En les partageant gratuitement, je contribue à la communauté tout en montrant ce que je sais faire. 
                      C'est aussi une façon de créer du lien et de générer de la confiance.
                    </p>
                    <p>
                      Si vous avez besoin d'un <strong>outil sur-mesure</strong> pour votre business, je peux développer une solution adaptée à vos besoins spécifiques.
                    </p>
                  </>
                )
              },
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
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Besoin d'un outil sur-mesure ?</h2>
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

        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Pour aller plus loin</h2>
          <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <p>
              <Link href="/blog" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Lisez mes articles
              </Link>
              {' • '}
              <Link href="/a-propos" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez mon parcours
              </Link>
              {' • '}
              <Link href="/donnees-publiques" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Suivez mes objectifs 2026
              </Link>
            </p>
          </div>
      </section>
    </main>
    </>
  )
} 