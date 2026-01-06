import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import FAQ from '../components/FAQ'
import SearchBar from '../components/SearchBar'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { tools } from '../lib/tools'

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedType, setSelectedType] = useState(null) // 'outil' | 'database' | null
  const [selectedPricing, setSelectedPricing] = useState(null) // 'gratuit' | 'payant' | null
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [videoSeen, setVideoSeen] = useState(false)

  // URL de la vidéo Tella
  const videoUrl = 'https://www.tella.tv/video/freelance-en-scrapping-et-automatisation-342e'
  const videoEmbedUrl = 'https://www.tella.tv/video/vid_cmjylsyom00bn04la9dfs342e/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0'

  // Vérifier si la vidéo a déjà été vue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('profileVideoSeen') === 'true'
      setVideoSeen(seen)
    }
  }, [])

  // Ouvrir la popup vidéo
  const handleVideoClick = () => {
    setShowVideo(true)
  }

  // Marquer la vidéo comme vue quand on ferme la popup (après avoir regardé)
  const handleCloseVideo = () => {
    setShowVideo(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileVideoSeen', 'true')
      setVideoSeen(true)
    }
  }

  const categories = ['Finance', 'Artisanat']
  const types = ['outil', 'database']
  const pricingOptions = ['gratuit', 'payant']

  const filteredTools = tools
    .filter(tool => {
      const matchesCategory = selectedCategory === null || tool.category === selectedCategory
      const matchesType = selectedType === null || tool.type === selectedType
      const matchesPricing = selectedPricing === null || 
        (selectedPricing === 'gratuit' && !tool.isPaid) ||
        (selectedPricing === 'payant' && tool.isPaid)
      return matchesCategory && matchesType && matchesPricing
    })
    .sort((a, b) => {
      // Trier par date : du plus récent au plus ancien
      const dateA = a.date ? new Date(a.date) : new Date(0) // Si pas de date, mettre en fin
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA // Ordre décroissant (plus récent en premier)
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

  // Structured Data pour la marketplace
  const toolsStructuredData = {
    name: 'Marketplace - Outils et Bases de Données',
    description: 'Collection d\'outils scraping, automatisation et bases de données pour automatiser vos processus business',
    numberOfItems: tools.length,
    items: tools.map((tool, index) => {
      const item = {
        '@type': tool.type === 'database' ? 'Dataset' : 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        applicationCategory: 'BusinessApplication',
        offers: {
          '@type': 'Offer',
          price: tool.isPaid ? (tool.annualPrice || tool.price || 0).toString() : '0',
          priceCurrency: 'EUR',
          availability: tool.isPaid ? 'https://schema.org/InStock' : 'https://schema.org/InStock'
        },
        url: `${siteConfig.url}${tool.link}`
      }
      
      // Ajouter les champs license et creator pour les bases de données (Dataset)
      if (tool.type === 'database') {
        item.license = 'https://creativecommons.org/licenses/by/4.0/'
        item.creator = {
          '@type': 'Person',
          name: siteConfig.author,
          url: siteConfig.url
        }
      }
      
      return {
        '@type': 'ListItem',
        position: index + 1,
        item
      }
    })
  }

  // Structured Data pour FAQ
  const faqData = {
    questions: [
      {
        '@type': 'Question',
        name: 'Comment utiliser concrètement vos outils gratuits ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'C\'est très simple : 1) Cliquez sur l\'outil qui vous intéresse dans la marketplace, 2) Sur la page de l\'outil, entrez votre email pour recevoir l\'accès (gratuit, sans engagement), 3) Une fois connecté, vous accédez à l\'interface de l\'outil avec des instructions claires, 4) Utilisez l\'outil directement dans votre navigateur, sans installation. Par exemple, le Générateur de Templates d\'Emails : vous sélectionnez le type de message (outreach, follow-up, etc.), vous personnalisez le contenu, et vous copiez-collez le template généré. L\'Extracteur LinkedIn : vous entrez vos critères de recherche, vous lancez l\'extraction, et vous téléchargez les résultats en CSV. Aucune compétence technique requise.'
        }
      },
      {
        '@type': 'Question',
        name: 'Les outils sont-ils vraiment gratuits ? Y a-t-il des limites ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, la plupart des outils sont 100% gratuits, sans limite de temps ni de nombre d\'utilisations. Certains outils ont des limites raisonnables pour éviter les abus : l\'Extracteur LinkedIn est limité à 50 profils par jour (gratuit), ce qui couvre largement les besoins de prospection d\'une TPE-PME. Si vous avez besoin de volumes plus importants, je peux développer une version sur-mesure. Les bases de données payantes (comme Dentistes Parisiens) sont clairement indiquées avec leurs prix. Aucun piège, tout est transparent.'
        }
      },
      {
        '@type': 'Question',
        name: 'Quelle est la différence entre l\'achat unique et l\'abonnement annuel pour les bases de données ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Les deux options sont au même prix. L\'achat unique : vous recevez la base de données une fois, sans mise à jour. L\'abonnement annuel : vous recevez la base de données initiale + une mise à jour automatique chaque année (nouvelles données, corrections, enrichissements). Exemple : Base Dentistes Parisiens à 79€ - avec l\'abonnement, vous recevez la version 2024 maintenant, puis automatiquement la version 2025 dans un an, puis 2026, etc. L\'abonnement est recommandé si vous utilisez les données sur le long terme et voulez garder vos fichiers à jour sans avoir à racheter chaque année.'
        }
      },
      {
        '@type': 'Question',
        name: 'Puis-je avoir un outil sur-mesure adapté à mon business ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolument ! Si vos besoins sont spécifiques, je développe des outils sur-mesure. Exemples : un extracteur adapté à votre secteur d\'activité, un générateur de contenu pour votre industrie, une automatisation de votre workflow spécifique. Le processus : 1) On discute de votre besoin (appel de 20 min gratuit), 2) Je vous propose une solution technique avec devis et délais, 3) Développement et livraison en moins d\'une semaine, 4) Formation et support inclus. Tarifs : à partir de 2000€ selon la complexité. Contactez-moi pour discuter de votre projet.'
        }
      }
    ]
  }

  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.outils.title,
    description: siteConfig.seo.pages.outils.description,
    path: '/marketplace',
    keywords: siteConfig.seo.pages.outils.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      
      {/* Review Schema 5* par défaut */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'Service',
            name: 'Marketplace - Outils et Bases de Données',
            url: `${siteConfig.url}/marketplace`,
            provider: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            }
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5',
            worstRating: '1'
          },
          author: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          reviewBody: 'Marketplace d\'outils scraping et automatisation gratuits et payants. Outils testés, documentés et prêts à l\'emploi pour automatiser vos processus business.',
          datePublished: new Date().toISOString().split('T')[0]
        }}
      />
      <StructuredData type="ItemList" data={toolsStructuredData} />
      <StructuredData type="FAQPage" data={faqData} />
      <main className="min-w-0 mt-6 flex flex-col">
        <section className="mb-8">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Marketplace
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight">
            Outils et bases de données développés pour automatiser vos processus business, générer des leads et optimiser votre productivité. Une sélection d'<strong className="text-neutral-900 dark:text-neutral-100">outils scraping et automatisation</strong> ainsi que de <strong className="text-neutral-900 dark:text-neutral-100">bases de données</strong> prêtes pour des analyses métiers ou de la prospection.
          </p>

          {/* Filtres */}
          <div className="space-y-4 mb-8">
            {/* Filtre par Type */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedType === null
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setSelectedType('outil')}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedType === 'outil'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  Outils
                </button>
                <button
                  onClick={() => setSelectedType('database')}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedType === 'database'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  Bases de données
                </button>
              </div>
            </div>

            {/* Filtre par Prix */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Prix
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPricing(null)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedPricing === null
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setSelectedPricing('gratuit')}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedPricing === 'gratuit'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  Gratuit
                </button>
                <button
                  onClick={() => setSelectedPricing('payant')}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedPricing === 'payant'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  Payant
                </button>
              </div>
            </div>

            {/* Filtre par Catégorie */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Catégorie
              </label>
              <SearchBar 
                tags={categories}
                selectedTag={selectedCategory}
                onTagSelect={setSelectedCategory}
              />
            </div>
          </div>
        </section>

        <section className="mb-16">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Aucun résultat ne correspond à vos filtres.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSelectedType(null)
                  setSelectedPricing(null)
                }}
                className="text-sm text-neutral-900 dark:text-neutral-100 underline hover:no-underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {filteredTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.link}
                  className="relative flex flex-col p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 mb-3">
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
                      <div className="mb-1">
                        <h2 className="font-semibold text-lg tracking-tighter group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                          {tool.name}
                        </h2>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Séparateur fin et prix */}
                  <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between gap-3">
                      {/* Espaceur pour aligner avec l'icône */}
                      <div className="flex-shrink-0 w-6 h-6"></div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          {tool.isPaid ? `À partir de ${tool.annualPrice || tool.price || 0}€` : 'Gratuit'}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                      </div>
                      {tool.date && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-500 flex-shrink-0">
                          {new Date(tool.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Questions fréquentes</h2>
          <FAQ
            items={[
              {
                question: "Comment utiliser concrètement vos outils gratuits ?",
                answer: "C'est très simple : 1) Cliquez sur l'outil qui vous intéresse dans la marketplace, 2) Sur la page de l'outil, entrez votre email pour recevoir l'accès (gratuit, sans engagement), 3) Une fois connecté, vous accédez à l'interface de l'outil avec des instructions claires, 4) Utilisez l'outil directement dans votre navigateur, sans installation. Par exemple, le Générateur de Templates d'Emails : vous sélectionnez le type de message (outreach, follow-up, etc.), vous personnalisez le contenu, et vous copiez-collez le template généré. L'Extracteur LinkedIn : vous entrez vos critères de recherche, vous lancez l'extraction, et vous téléchargez les résultats en CSV. Aucune compétence technique requise."
              },
              {
                question: "Les outils sont-ils vraiment gratuits ? Y a-t-il des limites ?",
                answer: "Oui, la plupart des outils sont 100% gratuits, sans limite de temps ni de nombre d'utilisations. Certains outils ont des limites raisonnables pour éviter les abus : l'Extracteur LinkedIn est limité à 50 profils par jour (gratuit), ce qui couvre largement les besoins de prospection d'une TPE-PME. Si vous avez besoin de volumes plus importants, je peux développer une version sur-mesure. Les bases de données payantes (comme Dentistes Parisiens) sont clairement indiquées avec leurs prix. Aucun piège, tout est transparent."
              },
              {
                question: "Quelle est la différence entre l'achat unique et l'abonnement annuel pour les bases de données ?",
                answer: "Les deux options sont au même prix. L'achat unique : vous recevez la base de données une fois, sans mise à jour. L'abonnement annuel : vous recevez la base de données initiale + une mise à jour automatique chaque année (nouvelles données, corrections, enrichissements). Exemple : Base Dentistes Parisiens à 79€ - avec l'abonnement, vous recevez la version 2024 maintenant, puis automatiquement la version 2025 dans un an, puis 2026, etc. L'abonnement est recommandé si vous utilisez les données sur le long terme et voulez garder vos fichiers à jour sans avoir à racheter chaque année."
              },
              {
                question: "Puis-je avoir un outil sur-mesure adapté à mon business ?",
                answer: "Absolument ! Si vos besoins sont spécifiques, je développe des outils sur-mesure. Exemples : un extracteur adapté à votre secteur d'activité, un générateur de contenu pour votre industrie, une automatisation de votre workflow spécifique. Le processus : 1) On discute de votre besoin (appel de 20 min gratuit), 2) Je vous propose une solution technique avec devis et délais, 3) Développement et livraison en moins d'une semaine, 4) Formation et support inclus. Tarifs : à partir de 2000€ selon la complexité. Contactez-moi pour discuter de votre projet."
              },
              {
                question: "Puis-je intégrer vos outils avec mes outils existants (CRM, Excel, etc.) ?",
                answer: "Oui, la plupart des outils exportent en formats standards (CSV, Excel, JSON) que vous pouvez importer dans n'importe quel CRM (HubSpot, Salesforce, Pipedrive), Excel, Google Sheets, ou base de données. Pour des intégrations automatiques (API, webhooks, Zapier), je peux développer une version sur-mesure qui se connecte directement à vos outils. Exemple : un scraper qui alimente automatiquement votre CRM toutes les semaines, ou un outil qui synchronise avec votre Google Sheets en temps réel. On discute de votre stack technique et je propose la meilleure solution d'intégration."
              }
            ]}
          />
        </section>

        <section className="mb-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4 group cursor-pointer" onClick={handleVideoClick}>
              <svg
                className="absolute inset-0 w-16 h-16"
                viewBox="0 0 70 70"
              >
                <defs>
                  <linearGradient id="instagram-gradient-marketplace" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f09433" />
                    <stop offset="25%" stopColor="#e6683c" />
                    <stop offset="50%" stopColor="#dc2743" />
                    <stop offset="75%" stopColor="#cc2366" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <circle
                  cx="35"
                  cy="35"
                  r="33"
                  fill="none"
                  stroke={videoSeen ? "#a3a3a3" : "url(#instagram-gradient-marketplace)"}
                  strokeWidth="2"
                  strokeDasharray="207.35"
                  strokeDashoffset={videoSeen ? "0" : "207.35"}
                  className={videoSeen ? "" : "animate-draw-circle"}
                  style={{
                    transformOrigin: '35px 35px',
                    transition: videoSeen ? 'stroke 0.5s ease-out' : 'none'
                  }}
                />
              </svg>
              <div className="rounded-full bg-white dark:bg-neutral-900 p-[2px] relative z-10">
                <Image
                  src="/images/profile-picture/cr-pp3.png"
                  alt="Photo de profil de Corentin Robert"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover transition-all group-hover:opacity-90"
                  style={{ objectPosition: 'center 30%' }}
                  priority
                />
              </div>
              {/* Overlay grisé avec icône play au hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/70 dark:bg-neutral-900/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-play text-white" viewBox="0 0 16 16">
                  <path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"/>
                </svg>
              </div>
            </div>
            
            {/* Popup vidéo */}
            {showVideo && videoEmbedUrl && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-neutral-900/80 dark:bg-neutral-900/80 backdrop-blur-sm"
                onClick={handleCloseVideo}
              >
                <div 
                  className="relative w-full max-w-[280px] md:max-w-sm rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleCloseVideo}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-neutral-900/90 dark:bg-neutral-100/90 text-white dark:text-neutral-900 hover:bg-neutral-900 dark:hover:bg-neutral-100 transition-colors"
                    aria-label="Fermer la vidéo"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                    </svg>
                  </button>
                  <div style={{ position: 'relative', paddingBottom: '177.78%', height: 0 }}>
                    <iframe
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      src={videoEmbedUrl}
                      allowFullScreen
                      allowTransparency
                      title="Présentation de Corentin Robert"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <h2 className="font-semibold text-xl mb-4 tracking-tighter">Besoin d'un outil sur-mesure ?</h2>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
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
              <Link href="/cas-usage" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez les cas d'usage
              </Link>
              {' • '}
              <Link href="/a-propos" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez mon parcours
              </Link>
              {' • '}
              <Link href="/newsletter" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Inscrivez-vous à la newsletter
              </Link>
              {' • '}
              <Link href="/temoignages" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Lisez les témoignages clients
              </Link>
              {' • '}
              <Link href="/objectifs" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Suivez mes objectifs 2026
              </Link>
              {' • '}
              <Link href="/spotify" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Découvrez mes playlists et artistes favoris
              </Link>
              {' • '}
              <Link href="/faq" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
                Consultez la FAQ
              </Link>
            </p>
          </div>
      </section>
    </main>
    </>
  )
}

