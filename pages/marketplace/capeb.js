import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import FAQ from '../../components/FAQ'
import Toast, { useToast } from '../../components/Toast'
import DownloadCounter from '../../components/DownloadCounter'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'
import { tools } from '../../lib/tools'

export default function Capeb() {
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [subscriptionType, setSubscriptionType] = useState('one-time') // 'one-time' ou 'annual' (par défaut: one-time)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  // Vérifier le paiement au chargement de la page (si retour de Stripe)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const sessionId = urlParams.get('session_id')

    if (paymentStatus === 'success' && sessionId) {
      // Vérifier le paiement
      verifyPayment(sessionId)
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const verifyPayment = async (sessionId) => {
    try {
      const response = await fetch('/api/tools/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (data.paid) {
        setPaymentVerified(true)
        setEmail(data.email || '')
        showToast('✓ Paiement confirmé ! Vous pouvez maintenant télécharger la base de données.', 'success')
      }
    } catch (error) {
      console.error('Erreur vérification paiement:', error)
    }
  }

  // Fonction pour flouter les emails
  const blurEmail = (email) => {
    if (!email) return '-'
    const [localPart, domain] = email.split('@')
    if (!domain) return email
    // Garder seulement le premier caractère de la partie locale et masquer le reste
    const blurredLocal = localPart.length > 1 ? localPart[0] + '***' : '***'
    // Garder le domaine mais masquer partiellement
    const domainParts = domain.split('.')
    const blurredDomain = domainParts.length > 0 
      ? domainParts[0].substring(0, 2) + '***.' + domainParts.slice(1).join('.')
      : domain
    return `${blurredLocal}@${blurredDomain}`
  }

  // Exemple de données pour la preview (basé sur les vraies colonnes de la base)
  const sampleData = [
    {
      name: 'MURZEAU AURELIEN',
      city: 'ST LAURENT SUR SEVRE',
      zipCode: '85290',
      mainActivity: 'Menuisier',
      phone: '02 51 63 04 69',
      email: 'aurelien.murzeau@wanadoo.fr',
      website: '',
      isRGE: 'Oui',
      speciality: ''
    },
    {
      name: 'DOS SANTOS',
      city: 'ST JULIEN DU SAULT',
      zipCode: '89330',
      mainActivity: 'Maçon',
      phone: '03 86 63 37 57',
      email: 'joseluisdossantos@orange.fr',
      website: '',
      isRGE: 'Oui',
      speciality: 'ASSAINISSEMENT DU TERRAIN-DRAINAGE'
    },
    {
      name: 'GRIMALDI DECORATION',
      city: 'BRIVES CHARENSAC',
      zipCode: '43700',
      mainActivity: 'Plâtrier',
      phone: '04 71 02 02 49',
      email: 'tgrimaldi@vg-deco.com',
      website: 'https://www.vg-deco.com',
      isRGE: 'Oui',
      speciality: ''
    },
    {
      name: 'MENUISERIE POUX',
      city: 'POLIGNY',
      zipCode: '39800',
      mainActivity: 'Agenceur',
      phone: '03 84 37 27 96',
      email: 'menuiserie.poux@wanadoo.fr',
      website: 'https://menuiseriepoux.com',
      isRGE: 'Oui',
      speciality: 'AGENCEMENT|CHASSIS FIXES OU OUVRANTS|CLOISONS...'
    }
  ]

  const toolData = {
    name: 'Base de données - Artisans CAPEB',
    description: 'Base de données complète des artisans de France (CAPEB) avec coordonnées, typologie de profession et informations de contact. Idéal pour la prospection et l\'analyse du marché de l\'artisanat français.',
    category: 'Artisanat',
    price: 99, // Prix TTC en euros (achat unique)
    priceHT: 82.50, // Prix HT (TVA 20%)
    priceLabel: '99 € TTC',
    priceLabelHT: '82,50 € HT',
    formats: ['Google Sheets'],
    lastUpdate: '03/01/2026',
    rows: 'Artisans de France',
    isPaid: true,
    unlockType: 'payment',
    relatedTools: [],
    problem: [
      'Difficulté à trouver les coordonnées complètes des artisans de France',
      'Données dispersées sur différents annuaires professionnels',
      'Manque d\'informations sur les typologies de profession',
      'Temps perdu à collecter manuellement les données'
    ],
    solution: [
      'Base de données complète et à jour des artisans CAPEB',
      '22 champs par entrée : coordonnées, SIRET, activités, labels RGE, géolocalisation, etc.',
      'Accès via Google Sheets : copiez et utilisez directement dans votre environnement',
      'Mise à jour régulière pour garantir la fraîcheur des données'
    ],
    howToSteps: [
      {
        name: 'Acheter la base de données',
        text: 'Achetez la base de données pour recevoir l\'accès complet aux artisans de France (CAPEB).'
      },
      {
        name: 'Copier sur Google Sheets',
        text: 'Après votre paiement, copiez la base de données complète sur Google Sheets en un clic.'
      },
      {
        name: 'Exporter ou utiliser directement',
        text: 'Utilisez directement les données dans Google Sheets ou exportez-les dans le format de votre choix (CSV, Excel, etc.).'
      },
      {
        name: 'Analyser et prospecter',
        text: 'Importez les données dans votre CRM, outil de prospection ou tableur pour commencer votre analyse et prospection.'
      }
    ],
    testimonials: [
      {
        name: 'Sophie M.',
        role: 'Commercial B2B',
        comment: 'Cette base de données m\'a fait gagner des semaines de recherche. Les données sont complètes et bien structurées. Parfait pour ma prospection auprès des artisans !',
        date: '02-01-2026',
        tags: 'Données complètes • Gain de temps • Prospection'
      },
      {
        name: 'Pierre D.',
        role: 'Analyste marché',
        comment: 'Excellente qualité de données. J\'ai pu analyser rapidement la répartition des artisans par typologie et région. Très utile pour comprendre le marché !',
        date: '01-01-2026',
        tags: 'Qualité • Analyse • Utile'
      },
      {
        name: 'Marie P.',
        role: 'Entrepreneur',
        comment: 'Base de données très complète avec toutes les informations nécessaires. L\'export CSV s\'intègre parfaitement dans mon CRM.',
        date: '31-12-2025',
        tags: 'Complet • Intégration • CRM'
      }
    ]
  }

  const handleUnlock = async (e) => {
    e.preventDefault()
    
    if (toolData.isPaid && toolData.unlockType === 'payment') {
      if (subscriptionType === 'annual') {
        // Abonnement via Apify
        setIsLoading(true)
        setLoadingStep('Redirection vers Apify...')
        
        // Rediriger vers l'API Apify
        window.location.href = 'https://apify.com/corent1robert/capeb-scraper'
      } else {
        // Paiement Stripe (achat unique)
        setIsLoading(true)
        setLoadingStep('Redirection vers le paiement...')
        
        try {
          const response = await fetch('/api/tools/create-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              toolId: 'capeb',
              subscriptionType: 'one-time'
              // Note: Stripe collecte automatiquement l'email du client lors du checkout
            }),
          })

          const data = await response.json()

          if (response.ok && data.url) {
            // Rediriger vers Stripe Checkout
            window.location.href = data.url
          } else {
            showToast(data.error || 'Une erreur est survenue. Veuillez réessayer.', 'error')
            setIsLoading(false)
            setLoadingStep('')
          }
        } catch (error) {
          console.error('Erreur lors de la création du paiement:', error)
          showToast('Une erreur est survenue. Veuillez réessayer.', 'error')
          setIsLoading(false)
          setLoadingStep('')
        }
      }
    }
  }

  const faqItems = [
    {
      question: 'Comment utiliser cette base de données ?',
      answer: 'Achetez la base de données pour recevoir l\'accès complet. Après votre paiement, vous recevrez un lien pour copier la base de données sur Google Sheets. Vous pourrez ensuite l\'utiliser directement ou l\'exporter dans Excel, votre CRM ou tout autre outil d\'analyse.'
    },
    {
      question: 'Quel format est disponible ?',
      answer: 'La base de données est disponible via Google Sheets. Après votre achat, vous recevrez un lien pour copier la base de données complète sur Google Sheets, que vous pourrez ensuite exporter dans le format de votre choix (CSV, Excel, etc.).'
    },
    {
      question: 'Les données sont-elles à jour ?',
      answer: `Oui, la base de données est mise à jour régulièrement. Dernière mise à jour : ${toolData.lastUpdate}.`
    },
    {
      question: 'Combien d\'artisans sont inclus ?',
      answer: `La base de données contient tous les artisans de France (CAPEB) avec leurs coordonnées complètes, typologie de profession et informations de contact.`
    },
    {
      question: 'Quelle est la différence entre l\'achat unique et l\'accès API récurrent ?',
      answer: 'L\'achat unique à 99€ vous donne un accès immédiat à la base de données complète via Google Sheets, sans renouvellement. L\'accès API récurrent à 10$/mois vous permet d\'accéder à la même base de données via une API (apify.com/corent1robert/capeb-scraper), idéal si vous avez besoin d\'intégrer les données dans vos systèmes ou de les récupérer régulièrement.'
    },
    {
      question: 'Quelles typologies de profession sont incluses ?',
      answer: 'La base de données inclut toutes les typologies d\'artisans : charpentiers, maçons, plâtriers, électriciens, plombiers, agents, et bien d\'autres professions de l\'artisanat.'
    }
  ]

  const pageSEO = generatePageSEO({
    title: `${toolData.name} - Base de Données Artisans CAPEB | 99€`,
    description: `${toolData.description} Achetez la base de données complète des artisans CAPEB avec coordonnées, activités, labels RGE. Format Google Sheets. Achat unique 99€ ou accès API 10$/mois.`,
    path: '/marketplace/capeb',
    keywords: ['base de données artisans', 'artisans CAPEB', 'prospection artisans', 'annuaire artisans france', 'données artisans', 'CAPEB', 'artisans de France', 'base données artisans CAPEB']
  })

  const datasetStructuredData = {
    name: toolData.name,
    description: toolData.description,
    url: `${siteConfig.url}/marketplace/capeb`,
    datePublished: '2026-01-03',
    dateModified: toolData.lastUpdate ? toolData.lastUpdate.split('/').reverse().join('-') : '2026-01-03',
    keywords: ['artisans', 'CAPEB', 'prospection', 'base de données', 'artisanat'],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: `${siteConfig.url}/api/tools/download-csv?email=`
    }
  }

  const relatedToolsList = tools.filter(tool => 
    toolData.relatedTools.includes(tool.link.replace('/outils/', '').replace('/marketplace/', ''))
  )

  return (
    <>
      <SEOHead 
        {...pageSEO} 
        ogType="product"
      />
      
      {/* Review Schema 5* par défaut */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'Product',
            name: toolData.name,
            url: `${siteConfig.url}/marketplace/capeb`,
            offers: {
              '@type': 'Offer',
              price: '99',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '99',
                priceCurrency: 'EUR',
                valueAddedTaxIncluded: true
              }
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
          reviewBody: toolData.description,
          datePublished: new Date().toISOString().split('T')[0]
        }}
      />
      
      <StructuredData type="Dataset" data={datasetStructuredData} />
      
      {/* VideoObject Schema pour SEO vidéo */}
      <StructuredData
        type="VideoObject"
        data={{
          name: `${toolData.name} - Présentation vidéo`,
          description: toolData.description,
          thumbnailUrl: `${siteConfig.url}/images/video-thumbnail-capeb.jpg`,
          uploadDate: '2026-01-03',
          duration: 'PT3M12S', // À ajuster selon la durée réelle
          contentUrl: 'https://www.tella.tv/video/base-de-donnees-artisans-capeb-9000-contacts-a9b0',
          embedUrl: 'https://www.tella.tv/video/base-de-donnees-artisans-capeb-9000-contacts-a9b0/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0',
          publisher: {
            '@type': 'Person',
            name: siteConfig.author
          }
        }}
      />
      
      {toolData.howToSteps && toolData.howToSteps.length > 0 && (
        <StructuredData
          type="HowTo"
          data={{
            name: `Comment utiliser ${toolData.name}`,
            description: `Guide d'utilisation étape par étape pour ${toolData.name}`,
            steps: toolData.howToSteps
          }}
        />
      )}
      {toast && <Toast {...toast} onClose={hideToast} />}
      
      <main className="min-w-0 mt-6 flex flex-col">
        {/* Section principale */}
        <section className="mb-16">
          {/* Header - Mobile first */}
          <div className="mb-8 md:hidden">
            <h1 className="font-semibold text-2xl mb-3 tracking-tighter">
              {toolData.name}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 tracking-tight mb-3">
              {toolData.description}
            </p>
            <div className="flex items-center">
              <DownloadCounter toolId="capeb" />
            </div>
          </div>

          {/* Contenu principal */}
          <div>
            {/* Header - Desktop seulement */}
            <div className="hidden md:block mb-8">
              <h1 className="font-semibold text-2xl mb-3 tracking-tighter">
                {toolData.name}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 tracking-tight mb-3">
                {toolData.description}
              </p>
              <div className="flex items-center">
                <DownloadCounter toolId="capeb" />
              </div>
            </div>

            {/* Vidéo Tella - Entre le header et le formulaire */}
            <div className="mb-8 md:mb-12">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900" style={{
                boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))'
              }}>
                <iframe 
                  className="absolute top-0 left-0 w-full h-full border-0"
                  src="https://www.tella.tv/video/base-de-donnees-artisans-capeb-9000-contacts-a9b0/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0"
                  allowFullScreen
                  allowTransparency
                  title="Présentation Base de données CAPEB"
                />
              </div>
            </div>

            {/* Formulaire - Mobile seulement */}
            <div className="md:hidden mb-6">
                {toolData.isPaid && toolData.unlockType === 'payment' ? (
                  paymentVerified ? (
                    <div className="p-4 rounded-md bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
                        ✓ Paiement confirmé ! Vous pouvez maintenant accéder à la base de données complète.
                      </p>
                      <a
                        href="https://docs.google.com/spreadsheets/d/15HY_E4teMXSkYtz7OFpDk1G4wSw0Oy9eZqc3yeLzjkE/copy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Copier la base de données sur Google Sheets
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Toggle pour choisir le type */}
                      <div className="flex items-center justify-between p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setSubscriptionType('one-time')}
                          disabled={isLoading}
                          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            subscriptionType === 'one-time'
                              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                          } disabled:opacity-50`}
                        >
                          Achat unique
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubscriptionType('annual')}
                          disabled={isLoading}
                          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            subscriptionType === 'annual'
                              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                          } disabled:opacity-50`}
                        >
                          Accès API
                        </button>
                      </div>

                      {/* Bouton unique qui varie selon le choix */}
                      <div className="p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <button
                          onClick={handleUnlock}
                          disabled={isLoading}
                          className="w-full px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium relative overflow-hidden"
                        >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {loadingStep || 'Redirection...'}
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-semibold">
                              {subscriptionType === 'annual' ? '10$/mois' : toolData.priceLabel.replace(' TTC', '')}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-500">
                              {subscriptionType === 'annual' ? 'Via API' : 'Achat unique'}
                            </span>
                          </div>
                        )}
                        {isLoading && (
                          <div className="absolute bottom-0 left-0 h-0.5 bg-white dark:bg-neutral-900 animate-progress" style={{ animation: 'progress 2s linear infinite' }} />
                        )}
                        </button>
                      </div>

                      {/* Texte descriptif selon le choix */}
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        {subscriptionType === 'annual' ? (
                          <div>
                            <span><strong className="text-neutral-700 dark:text-neutral-300">Accès API récurrent :</strong> Accès mensuel à la base de données via API (10$/mois). <a href="https://apify.com/corent1robert/capeb-scraper" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">apify.com/corent1robert/capeb-scraper</a></span>
                          </div>
                        ) : (
                          <div>
                            <span><strong className="text-neutral-700 dark:text-neutral-300">Achat unique :</strong> Accès immédiat à la base de données complète via Google Sheets, sans renouvellement.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : null}
              </div>

              {/* Informations - Mobile seulement */}
              <div className="md:hidden mt-6">
                <div className="space-y-4 text-sm">
                  {toolData.isPaid && (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-neutral-500 dark:text-neutral-500">Achat unique</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                          <div>{toolData.priceLabel}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-500">{toolData.priceLabelHT}</div>
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-neutral-500 dark:text-neutral-500">Accès API récurrent</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                          <div>10$/mois</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-500">Via API</div>
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-500 dark:text-neutral-500">Éléments</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                      {toolData.rows}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-500 dark:text-neutral-500">Formats disponibles</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right max-w-[60%]">
                      {toolData.formats.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-500 dark:text-neutral-500">Dernière mise à jour</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                      {toolData.lastUpdate}
                    </span>
                  </div>
                </div>
              </div>

            {/* Section téléchargement - Desktop seulement */}
            <div className="mb-8 hidden md:block">
                {toolData.isPaid && toolData.unlockType === 'payment' ? (
                  paymentVerified ? (
                    <div className="p-4 rounded-md bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
                        ✓ Paiement confirmé ! Vous pouvez maintenant accéder à la base de données complète.
                      </p>
                      <a
                        href="https://docs.google.com/spreadsheets/d/15HY_E4teMXSkYtz7OFpDk1G4wSw0Oy9eZqc3yeLzjkE/copy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Copier la base de données sur Google Sheets
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Toggle pour choisir le type */}
                      <div className="flex items-center justify-between p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setSubscriptionType('one-time')}
                          disabled={isLoading}
                          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            subscriptionType === 'one-time'
                              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                          } disabled:opacity-50`}
                        >
                          Achat unique
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubscriptionType('annual')}
                          disabled={isLoading}
                          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            subscriptionType === 'annual'
                              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                          } disabled:opacity-50`}
                        >
                          Accès API
                        </button>
                      </div>

                      {/* Bouton unique qui varie selon le choix */}
                      <button
                        onClick={handleUnlock}
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium relative overflow-hidden"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {loadingStep || 'Redirection...'}
                          </span>
                        ) : (
                          <div className="text-center">
                            <div className="font-semibold">
                              {subscriptionType === 'annual' ? '10$/mois' : toolData.priceLabel.replace(' TTC', '')}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                              {subscriptionType === 'annual' ? 'Via API' : 'Achat unique'}
                            </div>
                          </div>
                        )}
                        {isLoading && (
                          <div className="absolute bottom-0 left-0 h-0.5 bg-white dark:bg-neutral-900 animate-progress" style={{ animation: 'progress 2s linear infinite' }} />
                        )}
                      </button>

                      {/* Texte descriptif selon le choix */}
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        {subscriptionType === 'annual' ? (
                          <div>
                            <span><strong className="text-neutral-700 dark:text-neutral-300">Accès API récurrent :</strong> Accès mensuel à la base de données via API (10$/mois). <a href="https://apify.com/corent1robert/capeb-scraper" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">apify.com/corent1robert/capeb-scraper</a></span>
                          </div>
                        ) : (
                          <div>
                            <span><strong className="text-neutral-700 dark:text-neutral-300">Achat unique :</strong> Accès immédiat à la base de données complète via Google Sheets, sans renouvellement.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : null}
                
                {/* Séparateur fin */}
                <hr className="my-4 border-0 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
              </div>
            
              {/* Informations - Desktop seulement */}
              <div className="hidden md:block">
                <div className="space-y-4 text-sm">
                  {toolData.isPaid && (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-neutral-500 dark:text-neutral-500">Achat unique</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                          <div>{toolData.priceLabel}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-500">{toolData.priceLabelHT}</div>
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-neutral-500 dark:text-neutral-500">Accès API récurrent</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                          <div>10$/mois</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-500">Via API</div>
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-500 dark:text-neutral-500">Éléments</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                      {toolData.rows}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-500 dark:text-neutral-500">Formats disponibles</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right max-w-[60%]">
                      {toolData.formats.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-500 dark:text-neutral-500">Dernière mise à jour</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                      {toolData.lastUpdate}
                    </span>
                  </div>
                </div>
              </div>
          </div>
        </section>

        {/* Section Problème / Solution */}
        {(toolData.problem && toolData.solution) && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Colonne Problème */}
                <div>
                  <h2 className="font-semibold text-xl mb-6 tracking-tighter">Problème ?</h2>
                  <ul className="space-y-3">
                    {toolData.problem.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0">×</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
          
                {/* Colonne Solution */}
                <div>
                  <h2 className="font-semibold text-xl mb-6 tracking-tighter">La solution</h2>
                  <ul className="space-y-3">
                    {toolData.solution.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section Contenu de la base de données */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">Ce que contient la base de données</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Tous</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Artisans CAPEB</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">France</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Entière</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">10+</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Typologies</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">22</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Champs par entrée</p>
              </div>
            </div>
            
            {/* Liste des champs disponibles */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4 tracking-tighter">Champs inclus pour chaque artisan (22 colonnes)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">ID & SIRET</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Identifiant unique et numéro SIRET</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Nom & Slug</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Nom de l'entreprise et identifiant URL</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Forme juridique</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Code légal (EI, SARL, SAS, etc.)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Adresse complète</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Adresse, code postal, ville</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Téléphone</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Numéro et type (professionnel/personnel)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Email & Site web</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Contact email et URL du site</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Activité principale</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Menuisier, Maçon, Plâtrier, Électricien, etc.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Activités secondaires</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Liste des activités complémentaires</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Spécialité</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Spécialités techniques détaillées</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Labels RGE</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Certification RGE et mentions</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Géolocalisation</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Latitude et longitude</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Nom complet</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Nom du dirigeant ou de l'entreprise</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Aperçu des données */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">Exemple de données</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Aperçu de 5 entrées sur les {toolData.rows} disponibles :
            </p>
            {paymentVerified ? (
              <div className="mb-6 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                  <strong>Voir un aperçu complet :</strong> Vous pouvez copier et explorer un exemple complet de la base de données sur Google Sheets.
                </p>
                <a
                  href="https://docs.google.com/spreadsheets/d/15HY_E4teMXSkYtz7OFpDk1G4wSw0Oy9eZqc3yeLzjkE/copy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Copier l'exemple sur Google Sheets
                </a>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  <strong>Achetez la base de données</strong> pour accéder à l'aperçu complet sur Google Sheets avec toutes les colonnes et données.
                </p>
              </div>
            )}
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Ville</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Activité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">RGE</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {sampleData.map((row, index) => (
                      <tr key={index} className="hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{row.name}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{row.city} ({row.zipCode})</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{row.mainActivity}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{row.isRGE}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{blurEmail(row.email)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Exemple de 5 entrées sur {toolData.rows} disponibles dans la base de données complète
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Cas d'usage */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">Comment utiliser ces données ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <h3 className="font-semibold text-lg mb-3 tracking-tighter">Prospection commerciale</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">
                  Contactez directement les artisans par typologie ou région pour proposer vos services (matériaux, équipements, formations).
                </p>
                <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Filtrez par typologie pour cibler précisément</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Identifiez les artisans par région</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Importez dans votre CRM pour automatiser vos campagnes</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <h3 className="font-semibold text-lg mb-3 tracking-tighter">Analyse de marché</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">
                  Étudiez la répartition des artisans français pour identifier les opportunités et comprendre le marché de l'artisanat.
                </p>
                <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Analysez la densité par région</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Identifiez les typologies les plus représentées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Détectez les zones sous-servies</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section Témoignages */}
        {toolData.testimonials && toolData.testimonials.length > 0 && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl mb-6 tracking-tighter">
                Ce qu'en disent les utilisateurs
              </h2>
              <div className="space-y-6">
                {toolData.testimonials.map((testimonial, index) => (
                  <div key={index}>
                    <div
                      className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
                    >
                      <div className="mb-3">
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          {testimonial.tags || 'Témoignage utilisateur'}
                        </p>
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                          "{testimonial.comment}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">
                              {testimonial.name}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-500">
                              {testimonial.role}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          {testimonial.date}
                        </span>
                      </div>
                    </div>
                    <StructuredData
                      type="Review"
                      data={{
                        author: {
                          '@type': 'Person',
                          name: siteConfig.author,
                          url: siteConfig.url
                        },
                        datePublished: testimonial.date.split('-').reverse().join('-'),
                        reviewBody: testimonial.comment,
                        ratingValue: '5',
                        itemReviewed: {
                          '@type': 'Product',
                          name: toolData.name,
                          url: `${siteConfig.url}/marketplace/capeb`,
                          offers: {
                            '@type': 'Offer',
                            price: '99',
                            priceCurrency: 'EUR',
                            availability: 'https://schema.org/InStock',
                            priceSpecification: {
                              '@type': 'UnitPriceSpecification',
                              price: '99',
                              priceCurrency: 'EUR',
                              valueAddedTaxIncluded: true
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section "Il existe aussi" */}
        {relatedToolsList.length > 0 && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl mb-6 tracking-tighter">
                Il existe aussi
              </h2>
              <div className="space-y-4">
                {relatedToolsList.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.link}
                    className="group flex items-center justify-between py-3 border-b border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors mb-1">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-500">
                        {tool.category}
                      </p>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Questions fréquentes</h2>
          <FAQ items={faqItems} />
          <StructuredData
            type="FAQPage"
            data={{ questions: faqItems }}
          />
        </section>
      </main>
    </>
  )
}

