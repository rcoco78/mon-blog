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

export default function DentistesParisiens() {
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const { toast, showToast, hideToast } = useToast()

  // Exemple de données pour la preview
  const sampleData = [
    {
      nom: 'Dr. Martin Dubois',
      adresse: '15 Rue de Rivoli, 75001 Paris',
      telephone: '01 42 36 12 45',
      specialite: 'Orthodontie',
      arrondissement: '75001',
      siteWeb: 'www.dubois-dentiste.fr'
    },
    {
      nom: 'Dr. Sophie Laurent',
      adresse: '42 Avenue des Champs-Élysées, 75008 Paris',
      telephone: '01 45 62 78 90',
      specialite: 'Implantologie',
      arrondissement: '75008',
      siteWeb: 'www.laurent-dentaire.fr'
    },
    {
      nom: 'Dr. Pierre Moreau',
      adresse: '28 Boulevard Saint-Germain, 75005 Paris',
      telephone: '01 43 25 67 89',
      specialite: 'Parodontologie',
      arrondissement: '75005',
      siteWeb: 'www.moreau-dentiste.fr'
    },
    {
      nom: 'Dr. Marie Bernard',
      adresse: '67 Rue de la Paix, 75002 Paris',
      telephone: '01 40 20 30 40',
      specialite: 'Esthétique dentaire',
      arrondissement: '75002',
      siteWeb: 'www.bernard-dentaire.fr'
    },
    {
      nom: 'Dr. Jean Lefebvre',
      adresse: '89 Rue de Vaugirard, 75015 Paris',
      telephone: '01 45 78 90 12',
      specialite: 'Chirurgie orale',
      arrondissement: '75015',
      siteWeb: 'www.lefebvre-dentiste.fr'
    }
  ]

  const toolData = {
    name: 'Base de données - Dentistes Parisiens',
    description: 'Base de données complète des dentistes à Paris avec coordonnées, spécialités et informations de contact. Idéal pour la prospection et l\'analyse du marché dentaire parisien.',
    category: 'Scraping',
    price: 0,
    priceLabel: 'Gratuit',
    videoUrl: '',
    videoThumbnail: '/images/outils/dentistes-parisiens-thumb.jpg',
    formats: ['CSV', 'Excel', 'JSON'],
    lastUpdate: '20/01/2025',
    rows: '500+ dentistes',
    isPaid: false,
    unlockType: 'email',
    relatedTools: ['linkedin-extractor', 'email-generator'],
    problem: [
      'Difficulté à trouver les coordonnées complètes des dentistes parisiens',
      'Données dispersées sur différents annuaires',
      'Manque d\'informations sur les spécialités',
      'Temps perdu à collecter manuellement les données'
    ],
    solution: [
      'Base de données complète et à jour des dentistes parisiens',
      'Informations structurées : coordonnées, spécialités, arrondissements',
      'Export direct en CSV, Excel ou JSON',
      'Mise à jour régulière pour garantir la fraîcheur des données'
    ],
    howToSteps: [
      {
        name: 'Télécharger la base de données',
        text: 'Entrez votre email pour recevoir l\'accès à la base de données complète des dentistes parisiens.'
      },
      {
        name: 'Choisir le format',
        text: 'Sélectionnez le format qui vous convient : CSV pour Excel, JSON pour vos applications, ou Excel directement.'
      },
      {
        name: 'Importer dans votre outil',
        text: 'Importez les données dans votre CRM, outil de prospection ou tableur pour commencer votre analyse.'
      },
      {
        name: 'Analyser et prospecter',
        text: 'Utilisez les données pour analyser le marché, identifier des opportunités ou lancer vos campagnes de prospection.'
      }
    ],
    testimonials: [
      {
        name: 'Thomas M.',
        role: 'Commercial B2B',
        comment: 'Cette base de données m\'a fait gagner des semaines de recherche. Les données sont complètes et bien structurées. Parfait pour ma prospection !',
        date: '18-01-2025',
        tags: 'Données complètes • Gain de temps • Prospection'
      },
      {
        name: 'Camille D.',
        role: 'Analyste marché',
        comment: 'Excellente qualité de données. J\'ai pu analyser rapidement la répartition des dentistes par arrondissement et spécialité. Très utile !',
        date: '16-01-2025',
        tags: 'Qualité • Analyse • Utile'
      },
      {
        name: 'Lucas P.',
        role: 'Entrepreneur',
        comment: 'Base de données très complète avec toutes les informations nécessaires. L\'export CSV s\'intègre parfaitement dans mon CRM.',
        date: '15-01-2025',
        tags: 'Complet • Intégration • CRM'
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
            tool: 'dentistes-parisiens'
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
      question: 'Comment utiliser cette base de données ?',
      answer: 'Entrez votre email pour recevoir l\'accès à la base de données. Une fois téléchargée, vous pourrez l\'importer dans Excel, votre CRM ou tout autre outil d\'analyse.'
    },
    {
      question: 'La base de données est-elle vraiment gratuite ?',
      answer: 'Oui, cette base de données est entièrement gratuite. Aucun paiement n\'est requis pour y accéder.'
    },
    {
      question: 'Quels formats sont disponibles ?',
      answer: 'La base de données est disponible en CSV (pour Excel), Excel (.xlsx) et JSON. Choisissez le format qui correspond à vos besoins.'
    },
    {
      question: 'Les données sont-elles à jour ?',
      answer: `Oui, la base de données est mise à jour régulièrement. Dernière mise à jour : ${toolData.lastUpdate}.`
    },
    {
      question: 'Combien de dentistes sont inclus ?',
      answer: `La base de données contient ${toolData.rows} dentistes parisiens avec leurs coordonnées complètes, spécialités et informations de contact.`
    }
  ]

  const pageSEO = generatePageSEO({
    title: `${toolData.name} - Base de Données Gratuite`,
    description: toolData.description,
    path: '/outils/dentistes-parisiens',
    keywords: ['base de données dentistes paris', 'dentistes parisiens', 'prospection dentaire', 'annuaire dentistes paris', 'données dentistes']
  })

  const datasetStructuredData = {
    name: toolData.name,
    description: toolData.description,
    url: `${siteConfig.url}/outils/dentistes-parisiens`,
    datePublished: '2025-01-20',
    dateModified: toolData.lastUpdate ? toolData.lastUpdate.split('/').reverse().join('-') : '2025-01-20',
    keywords: ['dentistes', 'paris', 'prospection', 'base de données'],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: `${siteConfig.url}/api/tools/download-csv?email=`
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
      <StructuredData type="Dataset" data={datasetStructuredData} />
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
              <DownloadCounter toolId="dentistes-parisiens" />
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

              {/* Formulaire - Mobile seulement */}
              <div className="md:hidden mt-6">
                {toolData.unlockType === 'email' && !emailSubmitted ? (
                  <form onSubmit={handleUnlock} className="space-y-4">
                    <div>
                      <label htmlFor="email-mobile" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Recevoir la base de données par email
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
                        'Recevoir la base de données'
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
                    Télécharger la base de données
                  </button>
                )}
              </div>

              {/* Informations - Mobile seulement */}
              <div className="md:hidden mt-6">
                <div className="space-y-4 text-sm">
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
                <DownloadCounter toolId="dentistes-parisiens" />
              </div>
              
              {/* Section téléchargement - Desktop seulement */}
              <div className="mb-8 hidden md:block">
                {toolData.unlockType === 'email' && !emailSubmitted ? (
                  <form onSubmit={handleUnlock} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Recevoir la base de données par email
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
                      className="w-full px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isLoading ? 'Envoi en cours...' : 'Recevoir la base de données'}
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
                    Télécharger la base de données
                  </button>
                )}
              </div>
            
              {/* Informations - Desktop seulement */}
              <div className="hidden md:block">
                <div className="space-y-4 text-sm">
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
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">500+</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Dentistes</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">20</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Arrondissements</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">15+</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Spécialités</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">8</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Champs par entrée</p>
              </div>
            </div>
            
            {/* Liste des champs disponibles */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4 tracking-tighter">Champs inclus pour chaque dentiste</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Nom complet</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Nom et prénom du dentiste</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Adresse complète</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Rue, numéro, code postal</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Téléphone</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Numéro de contact direct</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Spécialité</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Orthodontie, Implantologie, etc.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Arrondissement</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">75001 à 75020</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Site web</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">URL du cabinet (si disponible)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Email</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Adresse email (si disponible)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Horaires</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Jours et heures d'ouverture</p>
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
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Arrondissement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Spécialité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Téléphone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {sampleData.map((row, index) => (
                      <tr key={index} className="hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{row.nom}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{row.arrondissement}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{row.specialite}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{row.telephone}</td>
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
                  Contactez directement les dentistes par arrondissement ou spécialité pour proposer vos services (équipements, logiciels, formations).
                </p>
                <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Filtrez par arrondissement pour cibler géographiquement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Identifiez les spécialités pour adapter votre offre</span>
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
                  Étudiez la répartition des dentistes parisiens pour identifier les opportunités et comprendre le marché.
                </p>
                <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Analysez la densité par arrondissement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>Identifiez les spécialités les plus représentées</span>
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
                        authorName: testimonial.name,
                        datePublished: testimonial.date.split('-').reverse().join('-'),
                        reviewBody: testimonial.comment,
                        ratingValue: '5',
                        itemReviewed: {
                          '@type': 'Dataset',
                          name: toolData.name,
                          url: `${siteConfig.url}/outils/dentistes-parisiens`
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

