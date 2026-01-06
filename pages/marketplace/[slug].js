/**
 * Page dynamique pour les bases de données marketplace
 * Générée automatiquement à partir des Google Sheets enrichis
 * Template complet basé sur capeb.js
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import FAQ from '../../components/FAQ'
import Toast, { useToast } from '../../components/Toast'
import DownloadCounter from '../../components/DownloadCounter'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'
import { getRelevantTestimonials } from '../../lib/testimonials'
import Breadcrumb from '../../components/Breadcrumb'

export default function MarketplaceDatabase({ database, relatedDatabases, notFound }) {
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [subscriptionType, setSubscriptionType] = useState('one-time')
  const [paymentVerified, setPaymentVerified] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  // Si pas trouvé, afficher 404
  if (notFound || !database) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-semibold mb-4">Base de données non trouvée</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Cette base de données n'existe pas ou a été supprimée.
        </p>
        <Link href="/marketplace" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Retour à la marketplace
        </Link>
      </div>
    )
  }

  // Vérifier le paiement au chargement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const paymentStatus = urlParams.get('payment')
      const sessionId = urlParams.get('session_id')

      if (paymentStatus === 'success' && sessionId) {
        verifyPayment(sessionId)
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const verifyPayment = async (sessionId) => {
    try {
      const response = await fetch('/api/tools/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Fonction pour anonymiser les données sensibles dans les exemples
  const anonymizeValue = (value, key) => {
    if (!value) return '-'
    const strValue = String(value).trim()
    const lowerKey = key.toLowerCase()
    const lowerValue = strValue.toLowerCase()
    
    // Anonymiser les noms et prénoms
    if (lowerKey.includes('nom') || lowerKey.includes('name') || lowerKey.includes('prénom') || lowerKey.includes('firstname') || lowerKey.includes('lastname')) {
      // Si c'est un nom composé ou avec plusieurs mots, garder la première lettre de chaque mot
      const words = strValue.split(/\s+/)
      if (words.length > 1) {
        return words.map(word => word.length > 0 ? word[0] + '**' : '**').join(' ')
      }
      // Sinon, garder les 2 premières lettres et masquer le reste
      if (strValue.length > 2) {
        return strValue.substring(0, 2) + '**'
      }
      return '**'
    }
    
    // Anonymiser les emails
    if (lowerKey.includes('email') || lowerKey.includes('mail') || strValue.includes('@')) {
      const [localPart, domain] = strValue.split('@')
      if (!domain) return strValue
      const blurredLocal = localPart.length > 1 ? localPart[0] + '***' : '***'
      const domainParts = domain.split('.')
      const blurredDomain = domainParts.length > 0 
        ? domainParts[0].substring(0, 2) + '***.' + domainParts.slice(1).join('.')
        : domain
      return `${blurredLocal}@${blurredDomain}`
    }
    
    // Anonymiser les téléphones (numéros avec +, espaces, tirets, etc.)
    if (lowerKey.includes('phone') || lowerKey.includes('téléphone') || lowerKey.includes('tel') || 
        lowerKey.includes('whatsapp') || lowerKey.includes('mobile') || lowerKey.includes('contact') ||
        /^[\+]?[\d\s\-\(\)]{8,}$/.test(strValue.replace(/\s/g, ''))) {
      // Garder les 2 premiers et 2 derniers chiffres, masquer le reste
      const digits = strValue.replace(/\D/g, '')
      if (digits.length >= 4) {
        const prefix = digits.substring(0, 2)
        const suffix = digits.substring(digits.length - 2)
        return `+${prefix}***${suffix}`
      }
      return '***'
    }
    
    // Anonymiser les URLs LinkedIn et autres profils personnels
    if (lowerValue.includes('linkedin.com/in/') || lowerValue.includes('linkedin.com/company/') ||
        (lowerKey.includes('url') && (lowerValue.includes('profile') || lowerValue.includes('contact') || 
        lowerValue.includes('agent') || lowerValue.includes('real-estate-agent') || lowerValue.includes('linkedin')))) {
      const urlParts = strValue.split('/')
      if (urlParts.length > 0) {
        const lastPart = urlParts[urlParts.length - 1].split('?')[0] // Enlever les query params
        if (lastPart.length > 3) {
          return urlParts.slice(0, -1).join('/') + '/' + lastPart.substring(0, 3) + '***'
        }
      }
      return strValue
    }
    
    // Anonymiser les adresses complètes (si le champ contient "adresse" ou "address")
    if ((lowerKey.includes('adresse') || lowerKey.includes('address')) && strValue.length > 10) {
      const parts = strValue.split(',')
      if (parts.length > 0) {
        return parts[0].substring(0, 5) + '***' + (parts.length > 1 ? ', ' + parts[parts.length - 1] : '')
      }
      return strValue.substring(0, 5) + '***'
    }
    
    // Retourner la valeur originale si ce n'est pas un champ sensible
    return strValue
  }

  // Utiliser le taux d'enrichissement calculé lors de l'enrichissement (sur toute la base)
  // Si non disponible, calculer depuis les sampleData (moins précis)
  const contactCompleteness = database.enrichedData?.contactCompleteness || (() => {
    // Fallback : calculer depuis les sampleData si contactCompleteness n'existe pas
    const sampleData = database.enrichedData?.sampleData || []
    if (sampleData.length === 0) return {}
    
    const contactFields = database.headers.filter(header => {
      const headerLower = header.toLowerCase()
      return headerLower.includes('email') || 
             headerLower.includes('téléphone') || 
             headerLower.includes('telephone') || 
             headerLower.includes('phone') || 
             headerLower.includes('whatsapp') ||
             (headerLower.includes('url') && (headerLower.includes('linkedin') || headerLower.includes('profil') || headerLower.includes('profile')))
    })
    
    const completeness = {}
    
    contactFields.forEach(field => {
      const filled = sampleData.filter(row => {
        const value = row[field]
        return value && String(value).trim() !== '' && String(value).trim() !== '-'
      }).length
      const percentage = sampleData.length > 0 ? Math.round((filled / sampleData.length) * 100) : 0
      completeness[field] = { filled, total: sampleData.length, percentage, isEstimate: true }
    })
    
    return completeness
  })()

  // Préparer les données pour l'affichage
  const toolData = {
    name: database.name, // Le nom dans le JSON est déjà complet
    description: database.shortDescription || database.description, // Utiliser la description courte si disponible
    fullDescription: database.description, // Garder la description complète pour le SEO
    category: database.category,
    price: database.price,
    priceHT: Math.round((database.price / 1.2) * 100) / 100,
    priceLabel: `${database.price} € TTC`,
    priceLabelHT: `${Math.round((database.price / 1.2) * 100) / 100} € HT`,
    formats: ['Google Sheets'],
    lastUpdate: new Date(database.lastEnriched).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    rows: `${database.rowCount.toLocaleString()} entrées`,
    isPaid: database.isPaid,
    unlockType: 'payment',
    problem: database.enrichedData?.problem || [],
    solution: database.enrichedData?.solution || [],
    useCases: database.enrichedData?.useCases || [],
    howToSteps: [
      {
        name: 'Acheter la base de données',
        text: `Achetez la base de données pour recevoir l'accès complet à ${database.rowCount.toLocaleString()} entrées.`
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
        text: 'Importez les données dans votre CRM, outil de prospection ou tableur pour commencer votre analyse.'
      }
    ]
  }

  const handleUnlock = async (e) => {
    e.preventDefault()
    
    if (toolData.isPaid && toolData.unlockType === 'payment') {
      if (subscriptionType === 'api') {
        // Accès API via Apify - rediriger vers Apify avec lien d'affiliation
        setIsLoading(true)
        setLoadingStep('Redirection vers Apify...')
        
        // Rediriger vers Apify avec le lien d'affiliation
        // Le lien d'affiliation permet de tracker les conversions et génère des commissions
        window.location.href = 'https://apify.com?fpr=0n7ukq'
      } else {
        // Paiement Stripe (achat unique)
        setIsLoading(true)
        setLoadingStep('Redirection vers le paiement...')
        
        try {
          const response = await fetch('/api/tools/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: database.slug,
              subscriptionType: 'one-time'
            }),
          })

          const data = await response.json()

          if (response.ok && data.url) {
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

  // SEO
  const pageSEO = generatePageSEO({
    title: `${toolData.name} - Base de Données | ${database.price}€`,
    description: `${toolData.fullDescription} Achetez la base de données complète avec ${database.rowCount.toLocaleString()} entrées. Format Google Sheets.`,
    path: `/marketplace/${database.slug}`,
    keywords: database.enrichedData?.keywords || [database.name, 'base de données', 'prospection']
  })

  // Structured Data
  const datasetStructuredData = {
    name: toolData.name,
    description: database.description,
    url: `${siteConfig.url}/marketplace/${database.slug}`,
    datePublished: database.date,
    dateModified: database.lastEnriched,
    keywords: database.enrichedData?.keywords || [],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: `${siteConfig.url}/api/tools/download-csv?email=`
    }
  }

  // FAQ enrichie (générée dynamiquement par GPT)
  const faqItems = database.enrichedData?.faq && database.enrichedData.faq.length > 0
    ? database.enrichedData.faq
    : [
        // Fallback si GPT n'a pas généré de FAQ
        {
          question: `Quelles données sont incluses dans cette base ?`,
          answer: `La base de données contient ${database.rowCount.toLocaleString()} entrées avec ${database.headers.length} champs par entrée. Colonnes principales : ${database.headers.slice(0, 5).join(', ')}${database.headers.length > 5 ? '...' : ''}.`
        },
        {
          question: 'Comment utiliser cette base de données ?',
          answer: `Achetez la base de données pour recevoir l'accès complet. Après votre paiement, vous recevrez un lien pour copier la base de données sur Google Sheets. Vous pourrez ensuite l'utiliser directement ou l'exporter dans Excel, votre CRM ou tout autre outil d'analyse.`
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
          question: `Combien d'entrées sont incluses ?`,
          answer: `La base de données contient ${database.rowCount.toLocaleString()} entrées avec ${database.headers.length} champs par entrée.`
        }
      ]

  return (
    <>
      <SEOHead {...pageSEO} ogType="product" />
      
      {/* Product Schema avec aggregateRating pour afficher les étoiles dans Google */}
      <StructuredData
        type="Product"
        data={{
          name: toolData.name,
          description: toolData.fullDescription,
          url: `${siteConfig.url}/marketplace/${database.slug}`,
          image: siteConfig.ogImage,
          brand: {
            '@type': 'Person',
            name: siteConfig.author
          },
          offers: {
            '@type': 'Offer',
            price: database.price.toString(),
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: database.price.toString(),
              priceCurrency: 'EUR',
              valueAddedTaxIncluded: true
            }
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '5',
            reviewCount: '1',
            bestRating: '5',
            worstRating: '1'
          }
        }}
      />
      
      {/* Review Schema */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'Product',
            name: toolData.name,
            url: `${siteConfig.url}/marketplace/${database.slug}`
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
          reviewBody: toolData.fullDescription,
          datePublished: database.date
        }}
      />
      
      <StructuredData type="Dataset" data={datasetStructuredData} />
      
      {/* VideoObject Schema pour SEO vidéo (uniquement si vidéo disponible) */}
      {database.enrichedData?.videoUrl && (
        (() => {
          let videoUrl = database.enrichedData.videoUrl
          // Nettoyer l'URL pour le contentUrl (sans /embed)
          const contentUrl = videoUrl.replace('/embed', '').split('?')[0]
          // Construire l'embedUrl
          let embedUrl = videoUrl
          if (!embedUrl.includes('/embed')) {
            const tellaMatch = videoUrl.match(/tella\.tv\/video\/([^\/\?]+)/)
            if (tellaMatch) {
              embedUrl = `https://www.tella.tv/video/${tellaMatch[1]}/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
            } else {
              embedUrl = `${videoUrl}/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
            }
          }
          
          return (
            <StructuredData
              type="VideoObject"
              data={{
                name: `${toolData.name} - Présentation vidéo`,
                description: toolData.description,
                thumbnailUrl: database.enrichedData?.videoThumbnail || `${siteConfig.url}/images/video-thumbnail-default.jpg`,
                uploadDate: database.lastEnriched,
                duration: database.enrichedData?.videoDuration || 'PT3M',
                contentUrl: contentUrl,
                embedUrl: embedUrl,
                publisher: {
                  '@type': 'Person',
                  name: siteConfig.author
                }
              }}
            />
          )
        })()
      )}
      
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
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Fil d'Ariane">
          <ol className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>
              <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Accueil
              </Link>
            </li>
            <li className="flex items-center space-x-2">
              <span className="mx-1">/</span>
              <Link href="/marketplace" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Marketplace
              </Link>
            </li>
            <li className="flex items-center space-x-2">
              <span className="mx-1">/</span>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium line-clamp-1">
                {toolData.name}
              </span>
            </li>
          </ol>
        </nav>
        
        {/* Breadcrumb Schema */}
        <StructuredData
          type="BreadcrumbList"
          data={{
            items: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Accueil',
                item: siteConfig.url
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Marketplace',
                item: `${siteConfig.url}/marketplace`
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: toolData.name,
                item: `${siteConfig.url}/marketplace/${database.slug}`
              }
            ]
          }}
        />
        
        {/* Section principale */}
        <section className="mb-16">
          {/* Header - Mobile first */}
          <div className="mb-8 md:hidden">
            <h1 className="font-semibold text-2xl mb-3 tracking-tighter">
              {toolData.name}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 tracking-tight mb-3 text-base leading-relaxed">
              {toolData.description}
            </p>
            <div className="flex items-center">
              <DownloadCounter toolId={database.slug} />
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
                <DownloadCounter toolId={database.slug} />
              </div>
            </div>

            {/* Vidéo Tella - Entre le header et le formulaire */}
            <div className="mb-8 md:mb-12">
              {database.enrichedData?.videoUrl ? (
                // Afficher la vidéo si l'URL est fournie
                (() => {
                  let videoUrl = database.enrichedData.videoUrl
                  // Si l'URL ne contient pas /embed, l'ajouter avec les paramètres
                  if (!videoUrl.includes('/embed')) {
                    // Si c'est une URL Tella complète, extraire l'ID et construire l'embed
                    const tellaMatch = videoUrl.match(/tella\.tv\/video\/([^\/\?]+)/)
                    if (tellaMatch) {
                      videoUrl = `https://www.tella.tv/video/${tellaMatch[1]}/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
                    } else {
                      // Sinon, ajouter /embed à la fin
                      videoUrl = `${videoUrl}/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
                    }
                  }
                  
                  return (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900" style={{
                      boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))'
                    }}>
                      <iframe 
                        className="absolute top-0 left-0 w-full h-full border-0"
                        src={videoUrl}
                        allowFullScreen
                        allowTransparency
                        title={`Présentation ${toolData.name}`}
                      />
                    </div>
                  )
                })()
              ) : (
                // Encart "vidéo en cours de production" si pas de vidéo
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-12 h-12 mx-auto mb-4 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Vidéo en cours de production
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      La vidéo de présentation sera bientôt disponible
                    </p>
                  </div>
                </div>
              )}
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
                      href={`${database.sheetUrl}/copy`}
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
                        onClick={() => setSubscriptionType('api')}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                          subscriptionType === 'api'
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
                              {subscriptionType === 'api' ? 'Me demander' : toolData.priceLabel.replace(' TTC', '')}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-500">
                              {subscriptionType === 'api' ? 'Via API' : 'Achat unique'}
                            </span>
                          </div>
                        )}
                        {isLoading && (
                          <div className="absolute bottom-0 left-0 h-0.5 bg-white dark:bg-neutral-900 animate-progress" style={{ animation: 'progress 2s linear infinite' }} />
                        )}
                      </button>
                    </div>

                    {/* Texte descriptif selon le choix */}
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                      {subscriptionType === 'api' ? (
                        <div>
                          <p><strong className="text-neutral-700 dark:text-neutral-300">Accès API :</strong> Un script récupère automatiquement les données et les met à jour régulièrement. Vous avez accès à une base de données dynamique qui évolue dans le temps.</p>
                          <p className="text-neutral-500 dark:text-neutral-500 mt-1">La base sera partagée sur <a href="https://apify.com?fpr=0n7ukq" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">apify.com</a> pour un accès mensuel récurrent.</p>
                        </div>
                      ) : (
                        <div>
                          <p><strong className="text-neutral-700 dark:text-neutral-300">Achat unique :</strong> Vous recevez un accès immédiat à la base de données complète à l'instant T, avec toutes les données disponibles au moment de l'achat.</p>
                          <p className="text-neutral-500 dark:text-neutral-500 mt-1">Format Google Sheets, sans renouvellement. Les données sont figées au moment de l'achat.</p>
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
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-neutral-500 dark:text-neutral-500 block">Achat unique</span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 block mt-0.5">Données à l'instant T</span>
                      </div>
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                        <div>{toolData.priceLabel}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-500">{toolData.priceLabelHT}</div>
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-neutral-500 dark:text-neutral-500 block">Accès API</span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 block mt-0.5">Mise à jour régulière</span>
                      </div>
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                        <div>Me demander</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-500">Via Apify</div>
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-start justify-between">
                  <span className="text-neutral-500 dark:text-neutral-500">Éléments</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                    {toolData.rows}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-neutral-500 dark:text-neutral-500">Colonnes</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                    {database.headers.length} champs
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
                      href={`${database.sheetUrl}/copy`}
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
                        onClick={() => setSubscriptionType('api')}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                          subscriptionType === 'api'
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
                            {subscriptionType === 'api' ? 'Me demander' : toolData.priceLabel.replace(' TTC', '')}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                            {subscriptionType === 'api' ? 'Via API Apify' : 'Achat unique'}
                          </div>
                        </div>
                      )}
                      {isLoading && (
                        <div className="absolute bottom-0 left-0 h-0.5 bg-white dark:bg-neutral-900 animate-progress" style={{ animation: 'progress 2s linear infinite' }} />
                      )}
                    </button>

                    {/* Texte descriptif selon le choix */}
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                      {subscriptionType === 'api' ? (
                        <div>
                          <p><strong className="text-neutral-700 dark:text-neutral-300">Accès API :</strong> Un script récupère automatiquement les données et les met à jour régulièrement. Vous avez accès à une base de données dynamique qui évolue dans le temps.</p>
                          <p className="text-neutral-500 dark:text-neutral-500 mt-1">La base sera partagée sur <a href="https://apify.com?fpr=0n7ukq" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">apify.com</a> pour un accès mensuel récurrent.</p>
                        </div>
                      ) : (
                        <div>
                          <p><strong className="text-neutral-700 dark:text-neutral-300">Achat unique :</strong> Vous recevez un accès immédiat à la base de données complète à l'instant T, avec toutes les données disponibles au moment de l'achat.</p>
                          <p className="text-neutral-500 dark:text-neutral-500 mt-1">Format Google Sheets, sans renouvellement. Les données sont figées au moment de l'achat.</p>
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
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-neutral-500 dark:text-neutral-500 block">Achat unique</span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 block mt-0.5">Données à l'instant T</span>
                      </div>
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                        <div>{toolData.priceLabel}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-500">{toolData.priceLabelHT}</div>
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-neutral-500 dark:text-neutral-500 block">Accès API</span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 block mt-0.5">Mise à jour régulière</span>
                      </div>
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                        <div>Me demander</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-500">Via Apify</div>
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-start justify-between">
                  <span className="text-neutral-500 dark:text-neutral-500">Éléments</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                    {toolData.rows}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-neutral-500 dark:text-neutral-500">Colonnes</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                    {database.headers.length} champs
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
        {(toolData.problem && toolData.solution && toolData.problem.length > 0) && (
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
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{database.rowCount.toLocaleString()}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Entrées</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{database.headers.length}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Champs par entrée</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{database.category}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Catégorie</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">100%</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Complet</p>
              </div>
            </div>
            
            {/* Liste des champs disponibles */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4 tracking-tighter">Colonnes incluses ({database.headers.length} champs)</h3>
              
              {/* Fonction pour détecter si une colonne est un contact */}
              {(() => {
                // Vérifier si on a des données réelles de complétude
                const hasRealData = database.enrichedData?.contactCompleteness && 
                                    Object.keys(database.enrichedData.contactCompleteness).length > 0
                
                const isContactField = (header) => {
                  const headerLower = header.toLowerCase()
                  return headerLower.includes('email') || 
                         headerLower.includes('téléphone') || 
                         headerLower.includes('telephone') || 
                         headerLower.includes('phone') || 
                         headerLower.includes('whatsapp') ||
                         headerLower.includes('contact') ||
                         (headerLower.includes('url') && (headerLower.includes('linkedin') || headerLower.includes('profil') || headerLower.includes('profile')))
                }
                
                // Trier : contacts en premier, puis les autres (seulement si on a des données réelles)
                const sortedHeaders = [...database.headers].sort((a, b) => {
                  if (!hasRealData) return 0 // Pas de tri si pas de données
                  const aIsContact = isContactField(a)
                  const bIsContact = isContactField(b)
                  if (aIsContact && !bIsContact) return -1
                  if (!aIsContact && bIsContact) return 1
                  return 0
                })
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sortedHeaders.map((header, index) => {
                      const isContact = isContactField(header)
                      const completeness = contactCompleteness[header]
                      // Ne montrer les tags de contact que si on a des données réelles
                      const showContactTags = hasRealData && isContact && completeness && !completeness.isEstimate
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-start gap-2 min-h-[2.5rem] ${showContactTags ? 'font-semibold' : ''}`}
                        >
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`${showContactTags ? 'font-semibold' : 'font-medium'} text-neutral-900 dark:text-neutral-100 leading-tight`}>
                                {header}
                              </p>
                              {showContactTags && (
                                <>
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded whitespace-nowrap">
                                    Contact
                                  </span>
                                  {completeness.percentage >= 50 && (
                                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded whitespace-nowrap ${
                                      completeness.percentage >= 80 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                    }`}>
                                      {completeness.percentage}% disponible
                                    </span>
                                  )}
                                  {completeness.percentage < 50 && completeness.filled > 0 && (
                                    <span className="px-1.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded whitespace-nowrap">
                                      {completeness.filled.toLocaleString()} disponible{completeness.filled > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {showContactTags && completeness.percentage >= 50 && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5 leading-tight">
                                {completeness.filled.toLocaleString()} contacts disponibles
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            
            {/* Taux d'enrichissement des champs de contact - Affichage positif */}
            {(() => {
              // Ne pas afficher si on n'a pas de données réelles de complétude (seulement des estimations)
              const hasRealData = database.enrichedData?.contactCompleteness && 
                                  Object.keys(database.enrichedData.contactCompleteness).length > 0
              
              if (!hasRealData) return null
              
              const contactFields = database.headers.filter(header => {
                const headerLower = header.toLowerCase()
                return headerLower.includes('email') || 
                       headerLower.includes('téléphone') || 
                       headerLower.includes('telephone') || 
                       headerLower.includes('phone') || 
                       headerLower.includes('whatsapp') ||
                       (headerLower.includes('url') && (headerLower.includes('linkedin') || headerLower.includes('profil') || headerLower.includes('profile')))
              })
              
              // Filtrer pour n'afficher que les champs avec un taux raisonnable (>= 20%) et des données réelles
              const fieldsToShow = contactFields.filter(field => {
                const completeness = contactCompleteness[field]
                // Ne montrer que si on a des données réelles (pas d'estimation) et un taux >= 20%
                return completeness && 
                       !completeness.isEstimate && 
                       completeness.percentage >= 20 &&
                       completeness.filled > 0
              })
              
              if (fieldsToShow.length > 0) {
                return (
                  <div className="mt-6 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <h4 className="font-semibold text-base mb-2 text-neutral-900 dark:text-neutral-100">Contacts disponibles</h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                      Nombre de contacts disponibles dans la base de données
                    </p>
                    <div className="space-y-2.5">
                      {fieldsToShow.map((field) => {
                        const completeness = contactCompleteness[field]
                        if (!completeness) return null
                        
                        // Présenter de manière positive : "X contacts disponibles" au lieu de "X% rempli"
                        const availableCount = completeness.filled
                        const isHighQuality = completeness.percentage >= 70
                        
                        return (
                          <div key={field} className="flex items-center justify-between py-1">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{field}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                                {availableCount.toLocaleString()} disponible{availableCount > 1 ? 's' : ''}
                              </span>
                              {isHighQuality && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded whitespace-nowrap">
                                  Complet
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>
        </section>

        {/* Section Aperçu des données */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">Exemple de données</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Aperçu de {database.enrichedData?.sampleData?.length || 3} entrée(s) sur les {database.rowCount.toLocaleString()} disponibles :
            </p>
            
            {paymentVerified && (
              <div className="mb-6 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                  <strong>Voir un aperçu complet :</strong> Vous pouvez copier et explorer un exemple complet de la base de données sur Google Sheets.
                </p>
                <a
                  href={`${database.sheetUrl}/copy`}
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
            )}

            {/* Tableau d'exemples */}
            {database.enrichedData?.sampleData && database.enrichedData.sampleData.length > 0 ? (
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                        {Object.keys(database.enrichedData.sampleData[0] || {}).map((key, idx) => (
                          <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {database.enrichedData.sampleData.slice(0, 3).map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
                          {Object.keys(database.enrichedData.sampleData[0] || {}).map((key, colIdx) => {
                            const value = row[key] || ''
                            // Anonymiser les champs sensibles (email, téléphone, WhatsApp, etc.)
                            const displayValue = anonymizeValue(value, key)
                            return (
                              <td key={colIdx} className="px-4 py-3 text-neutral-900 dark:text-neutral-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                {displayValue}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Exemple de {Math.min(database.enrichedData.sampleData.length, 3)} entrée(s) sur {database.rowCount.toLocaleString()} disponibles dans la base de données complète
                  </p>
                </div>
              </div>
            ) : (
              // Fallback : Afficher un tableau avec les headers même sans sampleData
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                        {database.headers.map((header, idx) => (
                          <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {[1, 2, 3].map((rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
                          {database.headers.map((header, colIdx) => {
                            // Générer des données de placeholder basées sur le type de colonne
                            let placeholder = '—'
                            const headerLower = header.toLowerCase()
                            if (headerLower.includes('email')) {
                              placeholder = 'exemple@email.com'
                            } else if (headerLower.includes('prix') || headerLower.includes('price')) {
                              placeholder = '99,00 €'
                            } else if (headerLower.includes('téléphone') || headerLower.includes('phone')) {
                              placeholder = '01 23 45 67 89'
                            } else if (headerLower.includes('ville') || headerLower.includes('city')) {
                              placeholder = 'Paris'
                            } else if (headerLower.includes('code') && headerLower.includes('postal')) {
                              placeholder = '75001'
                            } else if (headerLower.includes('nom') || headerLower.includes('name')) {
                              placeholder = 'Exemple'
                            } else if (headerLower.includes('catégorie') || headerLower.includes('category')) {
                              placeholder = 'Catégorie'
                            } else if (headerLower.includes('disponibilité') || headerLower.includes('availability')) {
                              placeholder = 'En stock'
                            } else {
                              placeholder = 'Donnée exemple'
                            }
                            return (
                              <td key={colIdx} className="px-4 py-3 text-neutral-600 dark:text-neutral-400 italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                {placeholder}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Exemple de structure avec {database.headers.length} colonnes disponibles. Achetez la base de données pour voir les données réelles.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section Cas d'usage */}
        {toolData.useCases && toolData.useCases.length > 0 && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl mb-6 tracking-tighter">Comment utiliser ces données ?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {toolData.useCases.slice(0, 4).map((useCase, index) => (
                  <div key={index} className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <h3 className="font-semibold text-lg mb-3 tracking-tighter">{useCase}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                      Utilisez cette base de données pour {useCase.toLowerCase()}. Les données sont prêtes à l'emploi et peuvent être intégrées directement dans vos outils d'analyse ou de prospection.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Témoignages clients réels */}
        {(() => {
          const realTestimonials = getRelevantTestimonials(database.category, 3)
          return realTestimonials.length > 0 ? (
            <section className="mb-16">
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h2 className="font-semibold text-xl tracking-tighter">
                    Ce qu'en disent les utilisateurs
                  </h2>
                  <Link
                    href="/temoignages"
                    className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    Voir tous les témoignages
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                  </Link>
                </div>
                <div className="space-y-6">
                  {realTestimonials.map((testimonial, index) => (
                    <div key={index}>
                      <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                        <div className="mb-3">
                          <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                            {testimonial.tags || 'Témoignage client'}
                          </p>
                        </div>
                        <div className="flex items-start justify-between mb-4">
                          <p className="text-neutral-900 dark:text-neutral-100 italic flex-1">
                            "{testimonial.reviewBody}"
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-neutral-800 dark:text-neutral-200">
                                {testimonial.authorName}
                              </p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                {testimonial.authorJob}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            testimonial.source === 'Fiverr' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : testimonial.source === 'LinkedIn'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          }`}>
                            {testimonial.source}
                          </span>
                        </div>
                      </div>
                      <StructuredData
                        type="Review"
                        data={{
                          author: {
                            '@type': 'Person',
                            name: testimonial.authorName,
                            url: siteConfig.url
                          },
                          datePublished: testimonial.datePublished,
                          reviewBody: testimonial.reviewBody,
                          ratingValue: testimonial.ratingValue,
                          itemReviewed: {
                            '@type': 'Product',
                            name: toolData.name,
                            url: `${siteConfig.url}/marketplace/${database.slug}`
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null
        })()}

        {/* Section Garanties / Pourquoi nous choisir */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="font-semibold text-xl mb-6 tracking-tighter">Pourquoi choisir cette base de données ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-1">Données vérifiées</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Base de données complète et vérifiée avec {database.rowCount.toLocaleString()} entrées et {database.headers.length} champs par entrée.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-1">Mise à jour régulière</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Données mises à jour régulièrement pour garantir la fraîcheur et la pertinence des informations.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-1">Format flexible</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Accès via Google Sheets, exportable en CSV, Excel ou JSON pour s'adapter à vos outils.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bases de données similaires */}
        {relatedDatabases && relatedDatabases.length > 0 && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl mb-6 tracking-tighter">
                Il existe aussi
              </h2>
              <div className="space-y-4">
                {relatedDatabases.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/marketplace/${related.slug}`}
                    className="group flex items-center justify-between py-3 border-b border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors mb-1">
                        {related.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-500">
                        {related.category}
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

// Génération statique des pages
export async function getStaticPaths() {
  const { getAllDatabases } = await import('../../lib/marketplace-databases')
  const databases = await getAllDatabases() // Utiliser await car getAllDatabases est async
  
  const paths = databases.map(db => ({
    params: { slug: db.slug }
  }))

  return {
    paths,
    fallback: 'blocking'
  }
}

export async function getStaticProps({ params }) {
  const { getDatabaseBySlug, getRelatedDatabases } = await import('../../lib/marketplace-databases')
  
  const database = await getDatabaseBySlug(params.slug)
  
  if (!database) {
    return {
      notFound: true
    }
  }

  const relatedDatabases = await getRelatedDatabases(params.slug, 3)

  return {
    props: {
      database,
      relatedDatabases
    },
    revalidate: 3600
  }
}
