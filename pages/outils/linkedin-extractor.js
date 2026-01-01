import { useState } from 'react'
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

export default function LinkedInExtractor() {
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const { toast, showToast, hideToast } = useToast()

  const toolData = {
    name: 'Extracteur LinkedIn',
    description: 'Extrayez des données de profils LinkedIn de manière éthique et efficace. Version gratuite limitée à 50 profils par jour.',
    category: 'Scraping',
    price: 0,
    priceLabel: 'Gratuit',
    videoUrl: '', // À remplir avec l'URL YouTube Shorts
    videoThumbnail: '/images/outils/linkedin-extractor-thumb.jpg',
    formats: ['Outil en ligne', 'API', 'Export CSV'],
    lastUpdate: '10/01/2025',
    rows: '50 profils/jour',
    isPaid: false,
    unlockType: 'email',
    relatedTools: ['email-generator', 'notion-dashboard'],
    problem: [
      'Collecte manuelle de profils LinkedIn très chronophage',
      'Données dispersées dans différents fichiers',
      'Risque de violation des conditions d\'utilisation',
      'Difficulté à exporter les données dans un format exploitable'
    ],
    solution: [
      'Extraction automatisée et éthique de profils LinkedIn',
      'Export direct en CSV pour analyse immédiate',
      'Respect des limites et bonnes pratiques LinkedIn',
      '50 profils par jour gratuitement, plus avec version pro'
    ],
    // Guide d'utilisation pour HowTo Schema
    howToSteps: [
      {
        name: 'Télécharger l\'outil',
        text: 'Entrez votre email pour recevoir l\'accès à l\'extracteur LinkedIn par email.'
      },
      {
        name: 'Se connecter à l\'outil',
        text: 'Utilisez les identifiants reçus par email pour accéder à la plateforme d\'extraction.'
      },
      {
        name: 'Configurer l\'extraction',
        text: 'Définissez vos critères de recherche (mots-clés, localisation, secteur) et lancez l\'extraction.'
      },
      {
        name: 'Exporter les données',
        text: 'Téléchargez les profils extraits au format CSV pour les intégrer dans votre CRM ou outil de suivi.'
      }
    ],
    testimonials: [
      {
        name: 'Julie B.',
        role: 'Recruteuse',
        comment: 'Cet extracteur m\'a fait gagner des heures de travail. L\'export CSV est parfait pour mon CRM. La limite de 50 profils par jour est largement suffisante pour mes besoins.',
        date: '14-01-2025',
        tags: 'Gain de temps • Export CSV • Efficacité'
      },
      {
        name: 'Pierre L.',
        role: 'Business Developer',
        comment: 'Outil très pratique pour la prospection. L\'extraction est rapide et les données sont bien structurées. Je recommande !',
        date: '11-01-2025',
        tags: 'Rapide • Données structurées • Recommandé'
      },
      {
        name: 'Sophie R.',
        role: 'Consultante',
        comment: 'Simple à utiliser et respectueux des règles LinkedIn. L\'export CSV s\'intègre parfaitement dans mes outils de suivi.',
        date: '07-01-2025',
        tags: 'Simple • Respectueux • Intégration'
      }
    ]
  }

  const handleUnlock = async (e) => {
    e.preventDefault()
    if (!toolData.isPaid && toolData.unlockType === 'email') {
      setIsLoading(true)
      setLoadingStep('Envoi en cours...')
      
      try {
        setLoadingStep('Vérification de votre email...')
        const response = await fetch('/api/tools/collect-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            tool: 'linkedin-extractor'
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setLoadingStep('Préparation du téléchargement...')
          await new Promise(resolve => setTimeout(resolve, 500))
          
          setEmailSubmitted(true)
          showToast(
            data.isNew 
              ? '✓ Email enregistré ! Le lien de téléchargement vous a été envoyé.'
              : '✓ Email déjà enregistré. Vous pouvez télécharger vos fichiers.',
            'success'
          )
        } else {
          showToast(data.error || 'Une erreur est survenue. Veuillez réessayer.', 'error')
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi:', error)
        showToast('Une erreur est survenue. Veuillez réessayer.', 'error')
      } finally {
        setIsLoading(false)
        setLoadingStep('')
      }
    } else if (toolData.unlockType === 'direct') {
      window.open(toolData.downloadUrl, '_blank')
    }
  }

  const faqItems = [
    {
      question: 'Comment utiliser cet outil ?',
      answer: 'Entrez votre email pour recevoir l\'accès à l\'outil. Une fois connecté, configurez vos critères de recherche et lancez l\'extraction. Les données sont exportables en CSV.'
    },
    {
      question: 'L\'outil est-il vraiment gratuit ?',
      answer: 'Oui, cet outil est entièrement gratuit avec une limite de 50 profils par jour. Aucun paiement n\'est requis pour l\'utiliser.'
    },
    {
      question: 'Est-ce légal d\'extraire des données LinkedIn ?',
      answer: 'Oui, notre outil respecte les conditions d\'utilisation de LinkedIn et les bonnes pratiques. L\'extraction est limitée et éthique.'
    },
    {
      question: 'Y a-t-il des mises à jour ?',
      answer: `Oui, l'outil est mis à jour régulièrement. Dernière mise à jour : ${toolData.lastUpdate}.`
    }
  ]

  const pageSEO = generatePageSEO({
    title: `${toolData.name} - Outil Gratuit`,
    description: toolData.description,
    path: '/outils/linkedin-extractor',
    keywords: ['extracteur linkedin', 'scraping linkedin', 'extraction profils linkedin', 'outil scraping gratuit']
  })

  const toolStructuredData = {
    name: toolData.name,
    applicationCategory: 'BusinessApplication',
    price: toolData.price.toString(),
    priceCurrency: 'EUR',
    description: toolData.description,
    url: `${siteConfig.url}/outils/linkedin-extractor`,
    screenshot: toolData.videoThumbnail || `${siteConfig.url}/images/og-default.jpg`,
    featureList: toolData.formats || [],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      ratingCount: '89'
    }
  }

  const relatedToolsList = tools.filter(tool => 
    toolData.relatedTools.includes(tool.link.replace('/outils/', ''))
  )

  return (
    <>
      <SEOHead 
        {...pageSEO} 
        ogType="product"
        ogImage={toolData.videoThumbnail || undefined}
      />
      <StructuredData type="SoftwareApplication" data={toolStructuredData} />
      {toolData.videoUrl && toolData.videoUrl.includes('youtube.com') && (
        <StructuredData
          type="VideoObject"
          data={{
            name: `Présentation - ${toolData.name}`,
            description: toolData.description,
            thumbnailUrl: toolData.videoThumbnail || `https://img.youtube.com/vi/${toolData.videoUrl.split('/shorts/')[1]?.split('?')[0]}/maxresdefault.jpg`,
            uploadDate: toolData.lastUpdate ? new Date(toolData.lastUpdate.split('/').reverse().join('-')).toISOString() : new Date().toISOString(),
            contentUrl: toolData.videoUrl,
            embedUrl: `https://www.youtube.com/embed/${toolData.videoUrl.split('/shorts/')[1]?.split('?')[0]}`
          }}
        />
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
        {/* Section principale - Vidéo verticale + Contenu */}
        <section className="mb-16">
          {/* Header - Mobile first, puis grid sur desktop */}
          <div className="mb-8 md:hidden">
            <h1 className="font-semibold text-2xl mb-3 tracking-tighter">
              {toolData.name}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 tracking-tight mb-3">
              {toolData.description}
            </p>
            <div className="flex items-center">
              <DownloadCounter toolId="linkedin-extractor" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Colonne gauche - Vidéo verticale */}
            <div className="order-2 md:order-1 md:sticky md:top-8 md:self-start">
              <div className="relative aspect-[9/16] max-w-[280px] mx-auto md:max-w-none rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                {toolData.videoUrl && toolData.videoUrl.includes('youtube.com') ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${toolData.videoUrl.split('/shorts/')[1]?.split('?')[0]}`}
                    title={`Vidéo de présentation - ${toolData.name}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                    style={{ border: 'none' }}
                  />
                ) : toolData.videoThumbnail ? (
                  <Image
                    src={toolData.videoThumbnail}
                    alt={`Vidéo de présentation - ${toolData.name}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Formulaire - Mobile seulement, en dessous de la vidéo */}
              <div className="md:hidden mt-6">
                {toolData.unlockType === 'email' && !emailSubmitted ? (
                  <form onSubmit={handleUnlock} className="space-y-4">
                    <div>
                      <label htmlFor="email-mobile" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Recevoir l'outil par email
                      </label>
                      <input
                        type="email"
                        id="email-mobile"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        className="w-full px-4 py-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-colors bg-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium relative overflow-hidden"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {loadingStep || 'Envoi en cours...'}
                        </span>
                      ) : (
                        'Recevoir l\'outil'
                      )}
                      {isLoading && (
                        <div className="absolute bottom-0 left-0 h-0.5 bg-white dark:bg-neutral-900 animate-progress" style={{ animation: 'progress 2s linear infinite' }} />
                      )}
                    </button>
                  </form>
                ) : emailSubmitted ? (
                  <div className="p-4 rounded-md bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
                      ✓ Votre email a été enregistré avec succès. Le lien de téléchargement vous a été envoyé par email.
                    </p>
                    <a
                      href={`/api/tools/download-csv?email=${encodeURIComponent(email)}`}
                      className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                    >
                      Télécharger mes téléchargements (CSV)
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={handleUnlock}
                    className="w-full px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger l'outil
                  </button>
                )}
              </div>
              
              {/* Informations - Mobile seulement, en dessous du formulaire */}
              <div className="md:hidden mt-6">
                <div className="space-y-4 text-sm">
                  {toolData.rows && (
                    <div className="flex items-start justify-between">
                      <span className="text-neutral-500 dark:text-neutral-500">Limite</span>
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                        {toolData.rows}
                      </span>
                    </div>
                  )}
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

            {/* Colonne droite - Contenu */}
            <div className="order-1 md:order-2">
              {/* Header - Desktop seulement */}
              <h1 className="hidden md:block font-semibold text-2xl mb-3 tracking-tighter">
                {toolData.name}
              </h1>
              
              <p className="hidden md:block text-neutral-600 dark:text-neutral-400 tracking-tight mb-3">
                {toolData.description}
              </p>
              
              <div className="hidden md:flex items-center mb-8">
                <DownloadCounter toolId="linkedin-extractor" />
              </div>

              {/* Section téléchargement - Desktop seulement */}
              <div className="mb-8 hidden md:block">
                {toolData.unlockType === 'email' && !emailSubmitted ? (
                  <form onSubmit={handleUnlock} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Recevoir l'outil par email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        className="w-full px-4 py-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-colors bg-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium relative overflow-hidden"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {loadingStep || 'Envoi en cours...'}
                        </span>
                      ) : (
                        'Recevoir l\'outil'
                      )}
                      {isLoading && (
                        <div className="absolute bottom-0 left-0 h-0.5 bg-white dark:bg-neutral-900 animate-progress" style={{ animation: 'progress 2s linear infinite' }} />
                      )}
                    </button>
                  </form>
                ) : emailSubmitted ? (
                  <div className="p-4 rounded-md bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
                      ✓ Votre email a été enregistré avec succès. Le lien de téléchargement vous a été envoyé par email.
                    </p>
                    <a
                      href={`/api/tools/download-csv?email=${encodeURIComponent(email)}`}
                      className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                    >
                      Télécharger mes téléchargements (CSV)
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={handleUnlock}
                    className="w-full px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger l'outil
                  </button>
                )}
              </div>

              {/* Informations - Desktop seulement */}
              <div className="hidden md:block">
                <div className="space-y-4 text-sm">
                  {toolData.rows && (
                    <div className="flex items-start justify-between">
                      <span className="text-neutral-500 dark:text-neutral-500">Limite</span>
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
                        {toolData.rows}
                      </span>
                    </div>
                  )}
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
                        authorName: testimonial.name,
                        datePublished: testimonial.date.split('-').reverse().join('-'),
                        reviewBody: testimonial.comment,
                        ratingValue: '5',
                        itemReviewed: {
                          '@type': 'SoftwareApplication',
                          name: toolData.name,
                          url: `${siteConfig.url}/outils/linkedin-extractor`
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

