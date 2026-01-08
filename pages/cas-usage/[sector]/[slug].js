import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import SEOHead from '../../../components/seo/SEOHead'
import StructuredData from '../../../components/seo/StructuredData'
import FAQ from '../../../components/FAQ'
import { generatePageSEO } from '../../../lib/seo'
import { siteConfig } from '../../../lib/config'
import { slugToSector, sectorToSlug } from '../../../lib/case-studies-helpers'
// Imports dynamiques pour réduire le temps de compilation initial
import { tools } from '../../../lib/tools'
// import { getAllPosts } from '../../../lib/notion' // Non utilisé - chargement côté client si nécessaire
import { list } from '@vercel/blob'
import { useState, useEffect } from 'react'
import CaseStudyViewCounter from '../../../components/CaseStudyViewCounter'
import ReadingProgress from '../../../components/ReadingProgress'
import PersonalVideo from '../../../components/PersonalVideo'

// Fonction helper pour générer priceValidUntil (1 an dans le futur)
const getPriceValidUntil = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

// Fonction helper pour générer l'image du case study avec fallback
const getCaseStudyImage = (caseStudy, personalizedData) => {
  if (personalizedData?.dataExample) {
    return `${siteConfig.url}/images/case-studies/${caseStudy.slug}-data-example.png`;
  }
  // Fallback vers l'image du secteur, puis vers ogImage
  const sectorImage = `${siteConfig.url}/images/case-studies/${caseStudy.sector.toLowerCase()}.jpg`;
  return sectorImage || siteConfig.ogImage;
};

export default function CaseStudy({ caseStudy: caseStudyProp, relatedCaseStudies, relatedPosts, relatedTools, views = 0, isPopular = false, personalizedData: personalizedDataProp = null }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  // Utiliser les données personnalisées depuis props (Blob Storage) ou depuis caseStudy.personalized
  const [personalizedData, setPersonalizedData] = useState(personalizedDataProp || caseStudyProp?.personalized || null)
  const caseStudy = caseStudyProp
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

  useEffect(() => {
    setMounted(true)
    // Les données personnalisées sont maintenant chargées depuis Blob Storage dans getStaticProps
    // On les utilise directement depuis les props si disponibles
    if (personalizedDataProp) {
      setPersonalizedData(personalizedDataProp)
    } else if (caseStudy?.personalized) {
      setPersonalizedData(caseStudy.personalized)
    }
  }, [personalizedDataProp, caseStudy?.personalized])

  // Incrémenter la vue à chaque chargement de page (sans cache) - comme pour les articles de blog
  useEffect(() => {
    if (caseStudy?.slug && caseStudy?.sector) {
      // Incrémenter la vue en arrière-plan avec le secteur (ne pas attendre la réponse)
      fetch(`/api/case-studies-views/${caseStudy.slug}?increment=true&sector=${encodeURIComponent(caseStudy.sector)}`)
        .then(res => res.json())
        .then(data => {
          // Vue incrémentée avec succès
        })
        .catch(error => {
          console.warn('Erreur lors de l\'incrémentation des vues:', error)
          // Ne pas bloquer si l'incrémentation échoue
        })
    }
  }, [caseStudy?.slug, caseStudy?.sector])

  if (router.isFallback) {
    return (
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        {/* Skeleton Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-1">
            <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
            <div className="h-4 w-1 bg-neutral-300 dark:bg-neutral-700"></div>
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
            <div className="h-4 w-1 bg-neutral-300 dark:bg-neutral-700"></div>
            <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
            <div className="h-4 w-1 bg-neutral-300 dark:bg-neutral-700"></div>
            <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
          </div>
        </nav>

        {/* Skeleton Header */}
        <section className="mb-16">
          <div className="mb-3">
            <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"></div>
          </div>
          <div className="h-10 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-3"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
            <div className="h-4 w-1 bg-neutral-300 dark:bg-neutral-700"></div>
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
          </div>
          <div className="h-5 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-8"></div>
          
          {/* Skeleton Métriques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div className="h-6 w-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Skeleton Sections */}
        {[1, 2, 3, 4].map(i => (
          <section key={i} className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
              <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-6"></div>
              <div className="space-y-4">
                <div className="h-24 w-full bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
                <div className="h-24 w-full bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </section>
        ))}
      </main>
    )
  }

  if (!caseStudy) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold mb-4">Cas d'usage non trouvé</h1>
        <Link href="/cas-usage" className="text-blue-600 hover:underline">
          ← Retour aux cas d'usage
        </Link>
      </div>
    )
  }

  // Les données personnalisées sont chargées côté client (voir useEffect)

  const sectorSlug = sectorToSlug(caseStudy.sector)
  const pageUrl = `${siteConfig.url}/cas-usage/${sectorSlug}/${caseStudy.slug}`
  const today = new Date().toISOString() // Format ISO 8601 complet pour uploadDate

  // Vérifier si les données extraites sont des contacts (pour afficher l'option outbound)
  // Priorité : données personnalisées > données du case study
  let hasContactData = false
  if (personalizedData?.hasContactData !== undefined) {
    // Si les données personnalisées définissent explicitement hasContactData, l'utiliser
    hasContactData = personalizedData.hasContactData
  } else if (personalizedData?.dataExample?.columns) {
    // Sinon, vérifier dans les colonnes de l'exemple de données personnalisées
    const contactKeywords = ['email', 'e-mail', 'mail', 'contact', 'téléphone', 'telephone', 'phone', 'nom', 'prénom', 'prenom', 'lead', 'prospect', 'adresse', 'coordonnées']
    const columnsLower = personalizedData.dataExample.columns.map(c => c.toLowerCase()).join(' ')
    hasContactData = contactKeywords.some(keyword => columnsLower.includes(keyword))
  } else {
    // Fallback : vérifier dans les données extractibles du case study
    const contactKeywords = ['email', 'e-mail', 'mail', 'contact', 'téléphone', 'telephone', 'phone', 'nom', 'prénom', 'prenom', 'lead', 'prospect', 'adresse']
    const dataExtractedLower = caseStudy.dataExtracted.map(d => d.toLowerCase()).join(' ')
    hasContactData = contactKeywords.some(keyword => dataExtractedLower.includes(keyword))
  }

  // Enrichir la description SEO avec plus de détails et long-tail keywords
  const enrichedDescription = `${caseStudy.description} Extraction automatisée de données depuis ${caseStudy.examples.slice(0, 3).join(', ')}. Données extractibles : ${caseStudy.dataExtracted.slice(0, 5).join(', ')}. Solution sur-mesure pour ${caseStudy.sector.toLowerCase()}. Délai moyen 7 jours, livraison dans le format de votre choix (CSV, Excel, JSON, API).`

  const pageSEO = generatePageSEO({
    title: `${caseStudy.title} | Scraping & Automatisation ${caseStudy.sector}`,
    description: enrichedDescription,
    path: `/cas-usage/${caseStudy.slug}`,
    keywords: caseStudy.keywords,
    publishedTime: today,
    modifiedTime: today
  })

  // Processus étape par étape pour HowTo Schema
  const howToSteps = [
    {
      name: 'Analyse de vos besoins',
      duration: 'J+1 (24h)',
      text: `Nous analysons ensemble vos besoins spécifiques en ${caseStudy.sector.toLowerCase()} : quelles données extraire, quelles sources scraper, quel format de livraison. Un devis personnalisé vous est fourni sous 24h.`
    },
    {
      name: 'Développement du scraper',
      duration: 'J+2 à J+4 (3 jours)',
      text: `Je développe un scraper sur-mesure adapté à vos sources (${caseStudy.examples.slice(0, 2).join(', ')}) et à vos besoins. Le développement inclut la gestion des erreurs, la rotation des proxies et le respect des bonnes pratiques.`
    },
    {
      name: 'Extraction des données',
      duration: 'J+5 à J+6 (2 jours)',
      text: `L'extraction des données est lancée automatiquement. Les données sont nettoyées, structurées et validées pour garantir leur qualité. Un suivi en temps réel vous permet de suivre l'avancement.`
    },
    {
      name: 'Livraison et support',
      duration: 'J+7 (1 jour)',
      text: `Les données sont livrées dans le format de votre choix (Google Sheets, CSV, Excel, JSON, API). Un support est inclus pour vous aider à intégrer les données dans vos outils.`
    }
  ]

  // Témoignages réels - sélection variée selon le secteur
  const allTestimonials = [
    {
      authorName: 'Jean Paul Crenn',
      authorJob: 'Dirigeant VUCA Strategy',
      reviewBody: "Cela fait plusieurs missions de scrapping que nous confions à Corentin depuis maintenant 1 an et nous avons toujours été ravis de travailler avec lui tant au niveau de la qualité des résultats que de la rapidité de la livraison. Un point important à souligner, Corentin est également force de proposition et c'est un véritable dialogue qui se construit autour de chacun des projets, en toute fluidité, au bénéfice d'une grande efficience. Nous recommandons Vivement.",
      source: 'Fiverr',
      ratingValue: '5',
      datePublished: '2025-01-03',
      tags: '1 an de collaboration • Qualité • Rapidité • Force de proposition'
    },
    {
      authorName: 'Adnane Amahou',
      authorJob: 'Responsable CX @ NGI',
      reviewBody: "J'ai eu le plaisir de travailler avec Corentin dans le cadre de l'automatisation de plusieurs tâches. Très à l'écoute, il a su comprendre et détecter nos besoins immédiatement, avec une vraie capacité d'analyse et une grande efficacité dans la mise en œuvre. Super compétent, réactif et force de proposition, Corentin a clairement apporté de la valeur dès le départ.",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2024-01-15',
      tags: 'Automatisation • Compréhension immédiate • Valeur apportée dès le départ'
    },
    {
      authorName: 'Mohamed-Amine Zaghdoud',
      authorJob: 'Fondateur Kent',
      reviewBody: "Prestation de scraping impeccable : compréhension rapide du besoin, extraction propre et structurée, délais respectés. Les données livrées sont exploitables immédiatement (format clair, colonnes cohérentes, pas de doublons). Communication fluide et réactif tout au long du projet.",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2024-01-05',
      tags: 'Délais respectés • Données exploitables immédiatement • Communication fluide'
    },
    {
      authorName: 'Denis',
      authorJob: 'Inovesta',
      reviewBody: "Très professionnel dans les échanges et a respecté à la fois la demande et les délais. Corentin a aussi été très clair sur ce qu'il allait faire dès le départ, évitant les déceptions ou mauvaises surprises. Je recommande.",
      source: 'Malt',
      ratingValue: '5',
      datePublished: '2023-12-20',
      tags: 'Délais respectés • Clarté dès le départ • Professionnalisme'
    },
    {
      authorName: 'Hugues Chavrier',
      authorJob: 'Président @ Assursafe',
      reviewBody: "Nous avons travaillé à plusieurs reprises avec Corentin qui est très professionnel, rigoureux et à l'écoute de nos besoins. Je le recommande !",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2023-12-15',
      tags: 'Plusieurs missions • Professionnel • À l\'écoute'
    },
    {
      authorName: 'Chris Rydahl',
      authorJob: 'Cofounder & CTO @ Parallel',
      reviewBody: "Je recommande vivement Corentin pour sa réactivité et son professionnalisme. J'ai eu la chance de faire appel à lui à deux reprises, et à chaque fois, son accompagnement a été exemplaire.",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2023-12-05',
      tags: '2 missions • Réactivité • Accompagnement exemplaire'
    },
    {
      authorName: 'Julien Vabre',
      authorJob: 'Dirigeant InXpress Gironde',
      reviewBody: "Nous travaillons avec Corentin depuis plus de 3 ans. Il a toujours été de très bons conseils, réactif et appliqué. Je recommande à 💯 % !",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2023-11-20',
      tags: '3+ ans de collaboration • Conseils • Réactivité'
    },
    {
      authorName: 'jma225845',
      authorJob: 'France',
      reviewBody: "Nous sommes extrêmement satisfaits du travail réalisé. Corentin a fait preuve d'un grand professionnalisme, d'une excellente réactivité et d'un sens du détail remarquable. La communication a toujours été fluide et agréable, et le résultat final dépasse largement nos attentes.",
      source: 'Fiverr',
      ratingValue: '5',
      datePublished: '2023-11-15',
      tags: 'Résultat dépasse attentes • Communication fluide • Professionnalisme'
    },
    {
      authorName: 'buzzinsider',
      authorJob: 'États-Unis',
      reviewBody: "For any scraping needs, he is amazing, was able to scrape 400K companies from a complex site.",
      source: 'Fiverr',
      ratingValue: '5',
      datePublished: '2023-11-05',
      tags: '400K entreprises scrapées • Site complexe • Expertise scraping'
    }
  ]

  // Sélectionner 2-3 témoignages variés (mélange de sources et dates)
  const selectedTestimonials = [
    allTestimonials[0], // JP Crenn - récent, Fiverr
    allTestimonials[2], // Mohamed-Amine - LinkedIn, scraping
    allTestimonials[3] // Denis - Malt
  ]

  // Métriques et chiffres clés
  const metrics = [
    { 
      value: '7 jours', 
      label: 'Délai moyen de livraison', 
      icon: (
        <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      value: '600€ HT', 
      prefix: 'à partir de',
      label: 'Prix', 
      icon: (
        <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      value: '100%', 
      label: 'Données structurées', 
      icon: (
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      value: 'CSV, ou API', 
      label: 'Formats de livraison', 
      icon: (
        <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ]

  const serviceStructuredData = {
    '@type': 'Service',
    name: caseStudy.title,
    description: enrichedDescription,
    provider: {
      '@type': 'Person',
      name: 'Corentin Robert',
      url: siteConfig.url
    },
    areaServed: {
      '@type': 'Country',
      name: 'France'
    },
    serviceType: 'Scraping et Automatisation',
    category: caseStudy.sector,
    offers: {
      '@type': 'Offer',
      price: '500',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: getPriceValidUntil(),
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '500',
        priceCurrency: 'EUR',
        valueAddedTaxIncluded: true
      }
    },
    datePublished: today,
    dateModified: today
    // Note: aggregateRating retiré du Service car Google n'accepte pas Service pour Review snippets
    // Les avis sont gérés via les Review schemas séparés avec Product comme itemReviewed
  }

  // Breadcrumb pour SEO uniquement (invisible)
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: siteConfig.url
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Cas d\'usage',
      item: `${siteConfig.url}/cas-usage`
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: caseStudy.sector,
      item: `${siteConfig.url}/cas-usage/${sectorSlug}`
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: caseStudy.title,
      item: pageUrl
    }
  ]

  const faqItems = [
    {
      question: `Comment fonctionne le scraping pour ${caseStudy.sector.toLowerCase()} ?`,
      answer: `Le scraping permet d'extraire automatiquement toutes les données disponibles sur les sites web de ${caseStudy.examples.slice(0, 3).join(', ')} et autres sources. Les données sont structurées et livrées dans le format de votre choix (CSV, Excel, JSON, API). Le processus est automatisé et peut être programmé pour des mises à jour régulières. Cette solution est particulièrement adaptée pour ${caseStudy.sector.toLowerCase()} où la collecte manuelle de données prendrait des semaines.`
    },
    {
      question: `Quelles données exactes sont extractibles pour ${caseStudy.sector.toLowerCase()} ?`,
      answer: `Pour ${caseStudy.sector.toLowerCase()}, voici les principales données extractibles : ${caseStudy.dataExtracted.join(', ')}. La liste complète dépend des sources disponibles (${caseStudy.examples.slice(0, 3).join(', ')}) et peut être adaptée selon vos besoins spécifiques. Chaque projet est personnalisé pour extraire exactement les données dont vous avez besoin.`
    },
    {
      question: `Combien de temps pour obtenir les données ?`,
      answer: `Le délai moyen est de 7 jours pour un scraping complet. Cela inclut l'analyse des sources, le développement du scraper sur-mesure, l'extraction des données, la structuration et la livraison. Pour des volumes très importants (plusieurs centaines de milliers d'entrées), le délai peut être légèrement plus long. Un planning précis vous est communiqué dès la validation du projet.`
    },
    {
      question: `Dans quel format recevrai-je les données ?`,
      answer: `Les données sont livrées dans le format de votre choix : Google Sheets (recommandé pour la facilité d'utilisation et la collaboration), CSV (pour Excel), Excel, JSON (pour intégration API) ou via une API REST personnalisée. Si vous avez besoin d'un format spécifique ou d'une intégration directe dans votre CRM, je peux l'adapter.`
    },
    {
      question: `Les données sont-elles mises à jour régulièrement ?`,
      answer: `Oui, je peux mettre en place un système de mise à jour automatique. Les données peuvent être rafraîchies quotidiennement, hebdomadairement ou mensuellement selon vos besoins. Un abonnement annuel permet d'avoir des mises à jour automatiques sans intervention de votre part. Cela garantit que vos données restent toujours à jour.`
    },
    {
      question: `Puis-je avoir un scraping sur-mesure pour mon secteur ?`,
      answer: `Absolument ! Si votre besoin spécifique n'est pas couvert par ce cas d'usage, je développe des solutions sur-mesure adaptées à votre secteur et à vos objectifs. Discutons de votre projet lors d'un appel de 20 minutes gratuit pour définir la meilleure approche, les sources à scraper et le format de livraison optimal.`
    },
    {
      question: `Quel est le coût d'un projet de scraping ?`,
      answer: `Le coût dépend de plusieurs facteurs : le volume de données à extraire, la complexité des sources, la fréquence de mise à jour souhaitée et le format de livraison. Pour un projet ponctuel, les prix démarrent à partir de 500€. Pour des mises à jour régulières, un abonnement mensuel est proposé. Un devis personnalisé vous est fourni après analyse de vos besoins.`
    },
    {
      question: `Les données extraites sont-elles légales ?`,
      answer: `Oui, le scraping respecte les conditions d'utilisation des sites web et la réglementation en vigueur (RGPD, respect des robots.txt, limitation des requêtes). Je m'assure que toutes les données extraites sont publiquement accessibles et que l'extraction respecte les bonnes pratiques éthiques et légales du web scraping.`
    }
  ]

  const openCalendly = () => {
    if (!mounted) return
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
      if (window.Calendly) {
        window.Calendly.initPopupWidget({
          url: 'https://calendly.com/corentinrobert/20min'
        })
      }
    }
    document.body.appendChild(script)
  }

  return (
    <>
      <SEOHead {...pageSEO} />
      
      {/* Preload des liens vers les cas d'usage similaires pour améliorer la navigation */}
      {relatedCaseStudies.length > 0 && (
        <Head>
          {relatedCaseStudies.slice(0, 4).map(related => (
            <link
              key={related.slug}
              rel="preload"
              href={`/cas-usage/${sectorSlug}/${related.slug}`}
              as="document"
            />
          ))}
        </Head>
      )}
      
      {/* Breadcrumb Schema pour SEO (invisible) */}
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: breadcrumbItems
        }}
      />
      
      <StructuredData type="Service" data={serviceStructuredData} />
      
      <StructuredData
        type="FAQPage"
        data={{ questions: faqItems }}
      />

      {/* HowTo Schema pour le processus */}
      <StructuredData
        type="HowTo"
        data={{
          name: `Comment obtenir un scraping ${caseStudy.sector.toLowerCase()} sur-mesure`,
          description: `Processus étape par étape pour obtenir un scraping personnalisé pour ${caseStudy.sector.toLowerCase()}`,
          steps: howToSteps
        }}
      />

      {/* Article Schema pour enrichir les résultats de recherche */}
      <StructuredData
        type="Article"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: caseStudy.title,
          description: caseStudy.description,
          image: personalizedData?.dataExample 
            ? `${siteConfig.url}/images/case-studies/${caseStudy.slug}-data-example.png`
            : `${siteConfig.url}/images/case-studies/${caseStudy.sector.toLowerCase()}.jpg`,
          datePublished: today,
          dateModified: today,
          author: {
            '@type': 'Person',
            name: 'Corentin Robert',
            url: `${siteConfig.url}/a-propos`
          },
          publisher: {
            '@type': 'Organization',
            name: 'Corentin Robert',
            logo: {
              '@type': 'ImageObject',
              url: `${siteConfig.url}/images/logo.png`
            }
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': pageUrl
          },
          articleSection: caseStudy.sector,
          keywords: caseStudy.keywords.join(', ')
        }}
      />

      {/* Product Schema avec review pour Google Search Console */}
      <StructuredData
        type="Product"
        data={{
          name: caseStudy.title,
          description: `Service de scraping et automatisation pour ${caseStudy.sector.toLowerCase()}`,
          url: pageUrl,
          image: getCaseStudyImage(caseStudy, personalizedData),
          brand: {
            '@type': 'Brand',
            name: siteConfig.author,
            url: siteConfig.url
          },
          offers: {
            '@type': 'Offer',
            price: '500',
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: getPriceValidUntil(),
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '500',
              priceCurrency: 'EUR',
              valueAddedTaxIncluded: true
            }
          },
          review: {
            '@type': 'Review',
            author: {
              '@type': 'Person',
              name: 'Client satisfait',
              url: siteConfig.url
            },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: '5',
              bestRating: '5',
              worstRating: '1'
            },
            reviewBody: `Service professionnel de scraping pour ${caseStudy.sector.toLowerCase()}. Extraction de données rapide et fiable avec livraison dans les délais convenus.`,
            datePublished: today
          }
        }}
      />

      {/* Review Schema avec avis réels */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'Product',
            name: caseStudy.title,
            url: pageUrl,
            description: `Service de scraping et automatisation pour ${caseStudy.sector.toLowerCase()}`,
            image: getCaseStudyImage(caseStudy, personalizedData),
            brand: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            },
            offers: {
              '@type': 'Offer',
              price: '500',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              priceValidUntil: getPriceValidUntil(),
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '500',
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
            name: 'Client satisfait'
          },
          reviewBody: `Service professionnel de scraping pour ${caseStudy.sector.toLowerCase()}. Extraction de données rapide et fiable avec livraison dans les délais convenus.`,
          datePublished: today
        }}
      />

      {/* PriceRange Schema - Indication de prix */}
      <StructuredData
        type="PriceRange"
        data={{
          '@context': 'https://schema.org',
          '@type': 'PriceSpecification',
          price: '0',
          priceCurrency: 'EUR',
          valueAddedTaxIncluded: true,
          description: 'Devis personnalisé gratuit. Prix sur mesure selon le volume et la complexité du projet.'
        }}
      />

      {/* VideoObject Schema - Pour indexation dans Google Search Console */}
      <StructuredData
        type="VideoObject"
        data={{
          name: `Un mot de Corentin sur ${caseStudy.title}`,
          description: `Découvrez comment ce cas d'usage de scraping et d'automatisation peut s'adapter à vos besoins spécifiques pour le secteur ${caseStudy.sector.toLowerCase()}. Présentation personnalisée par Corentin Robert, expert freelance en scraping et automatisation.`,
          thumbnailUrl: `${siteConfig.url}/images/video-thumbnail.jpg`, // À remplacer par la vraie thumbnail Tella si disponible
          contentUrl: 'https://www.tella.tv/video/vid_cmk2d068v00xf04k15y3y0vaf',
          embedUrl: 'https://www.tella.tv/video/vid_cmk2d068v00xf04k15y3y0vaf/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0',
          uploadDate: today,
          duration: 'PT1M30S', // Durée approximative - à ajuster selon la vraie durée de votre vidéo
          publisher: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          }
        }}
      />

      <ReadingProgress />
      
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        {/* Breadcrumb visible */}
        <nav className="mb-6" aria-label="Fil d'Ariane">
          <ol className="flex items-center flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">
            <li>
              <Link href="/cas-usage" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Cas d'usage
              </Link>
            </li>
            <li className="flex items-center gap-x-1.5 sm:gap-x-2">
              <span className="text-neutral-400 dark:text-neutral-600">/</span>
              <Link href={`/cas-usage/${sectorSlug}`} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                {caseStudy.sector}
              </Link>
            </li>
            <li className="flex items-center gap-x-1.5 sm:gap-x-2 min-w-0">
              <span className="text-neutral-400 dark:text-neutral-600">/</span>
              <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate max-w-[200px] sm:max-w-none">
                {caseStudy.title}
              </span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <section className="mb-16">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-5xl mb-4">
                {caseStudy.title}
              </h1>
              
              <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-500 mb-4 flex-wrap">
                <div className="text-xs text-neutral-500 dark:text-neutral-500">
                  <CaseStudyViewCounter slug={caseStudy.slug} views={views} />
                </div>
                <span>•</span>
                <span>
                  {(() => {
                    // Priorité : colonnes de l'exemple personnalisé > dataExtracted
                    const count = personalizedData?.dataExample?.columns?.length || caseStudy.dataExtracted?.length || 0
                    return `${count} ${count === 1 ? 'type d\'information' : 'types d\'informations'}`
                  })()}
                </span>
                <span>•</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/cas-usage/${sectorSlug}`}
                    className="px-1.5 py-0.5 rounded text-xs transition-colors bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    {caseStudy.sector}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight leading-relaxed">
            {caseStudy.description}
          </p>

          {/* Vidéo personnalisée - Visible dès le début */}
          <PersonalVideo 
            title="Un mot de Corentin sur ce cas d'usage"
          />
          
          {/* Métriques clés - En un coup d'œil */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics.map((metric, index) => (
              <div key={index} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div className="mb-2 flex items-center">
                  {metric.icon}
                </div>
                <div className="mb-0.5">
                  {metric.prefix && (
                    <p className="text-xs font-normal text-neutral-600 dark:text-neutral-400 mb-0.5">
                      {metric.prefix}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {metric.value}
                  </p>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pourquoi ce cas d'usage ? */}
        {personalizedData?.whyUseCase && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
              <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
                Pourquoi ce cas d'usage ?
              </h2>
              <div className="space-y-4">
                <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Problèmes résolus
                    </h3>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    {personalizedData.whyUseCase.problemsSolved}
                  </p>
                </div>
                <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Exemples concrets d'utilisation
                    </h3>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    {personalizedData.whyUseCase.concreteExamples}
                  </p>
                </div>
                <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Impact business et ROI
                    </h3>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    {personalizedData.whyUseCase.businessImpact}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Options de livraison */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Choisissez l'une ou l'autre option de livraison
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Chaque projet de scraping peut être livré de deux façons différentes. Vous choisissez <strong className="text-neutral-900 dark:text-neutral-100">l'une ou l'autre</strong> selon votre objectif et votre usage quotidien :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
              {/* Option 1 : Livraison CSV */}
              <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">Option 1</span>
                    <svg className="w-6 h-6 text-neutral-600 dark:text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-neutral-100">
                    Livraison d'un fichier CSV
                  </h3>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-4">
                  Je développe le scraper, j'extrais les données et je vous livre un fichier CSV (ou Google Sheets, Excel, JSON) prêt à l'emploi. Parfait si vous avez besoin des données une seule fois ou ponctuellement.
                </p>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Données extraites et structurées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Format de votre choix (CSV, Sheets, Excel, JSON)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Idéal pour une extraction ponctuelle</span>
                  </li>
                </ul>
              </div>

              {/* Séparateur "OU" en desktop */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-white dark:bg-neutral-950 px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700">
                  <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">OU</span>
                </div>
              </div>

              {/* Option 2 : Script + Apify */}
              <div className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">Option 2</span>
                    <svg className="w-6 h-6 text-neutral-600 dark:text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-neutral-100">
                    Livraison du script + intégration <Link href="https://apify.com?fpr=0n7ukq" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">Apify</Link>
                  </h3>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-4">
                  Je développe le scraper et je le déploie sur <Link href="https://apify.com?fpr=0n7ukq" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 font-medium hover:underline">Apify</Link>, une plateforme professionnelle de scraping. Vous pouvez ensuite l'exécuter vous-même, à la demande ou en automatique, et récupérer les données à chaque fois.
                </p>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Script déployé et prêt à l'emploi sur <Link href="https://apify.com?fpr=0n7ukq" target="_blank" rel="noopener noreferrer" className="text-neutral-600 dark:text-neutral-400 font-medium hover:underline">Apify</Link></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Exécution à la demande ou programmée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Idéal pour un usage quotidien et récurrent</span>
                  </li>
                </ul>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 italic">
                  <Link href="https://apify.com?fpr=0n7ukq" target="_blank" rel="noopener noreferrer" className="hover:underline">Apify</Link> est une plateforme professionnelle qui gère l'infrastructure, la scalabilité et la maintenance technique. Vous vous concentrez sur l'utilisation des données, pas sur la technique.
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-6 leading-relaxed">
              Nous discutons ensemble de votre besoin lors de l'appel gratuit pour déterminer <strong className="text-neutral-900 dark:text-neutral-100">quelle option correspond le mieux à votre usage</strong>. Chaque projet est livré avec une seule de ces deux options.
            </p>
          </div>
        </section>

        {/* Processus étape par étape */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Comment ça fonctionne ?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Processus simple et transparent pour obtenir vos données en 7 jours{/* (14 jours avec accompagnement outbound) */} :
            </p>
            <div className="relative pl-4 sm:pl-6">
              {/* Ligne verticale en pointillés */}
              <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(212 212 212) 4px, rgb(212 212 212) 8px)' }}></div>
              <div className="absolute left-0 top-0 bottom-0 w-[1px] hidden dark:block" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(64 64 64) 4px, rgb(64 64 64) 8px)' }}></div>
              <div className="space-y-6">
                {howToSteps.map((step, index) => (
                  <div key={index} className="relative flex flex-col sm:flex-row sm:gap-4">
                    {/* Point sur la ligne */}
                    <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-400 dark:bg-neutral-600 border-2 border-white dark:border-neutral-900 z-10"></div>
                    <div className="w-full sm:w-32 sm:flex-shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-0 pl-0 sm:pl-4">
                      <div>Étape {index + 1}</div>
                      {step.duration && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                          {step.duration}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pl-0 sm:pl-4">
                      <h3 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                        {step.name}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                        {step.text}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Étape optionnelle : Accompagnement outbound - Uniquement si données de contacts */}
                {hasContactData && (
                  <div className="relative flex flex-col sm:flex-row sm:gap-4 pt-2">
                    {/* Point sur la ligne - style différent pour optionnel */}
                    <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-neutral-300 dark:bg-neutral-700 border-2 border-dashed border-white dark:border-neutral-900 z-10"></div>
                    <div className="w-full sm:w-32 sm:flex-shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-0 pl-0 sm:pl-4">
                      <div className="flex items-center gap-1.5">
                        <span>Option</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">+7j</span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        J+8 à J+14
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pl-0 sm:pl-4">
                      <h3 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                        Accompagnement stratégie outbound
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-3">
                        En option, je vous accompagne sur la stratégie outbound pour exploiter au mieux vos données de contacts extraites :
                      </p>
                      <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Copywriting</strong> : rédaction de séquences d'emails performantes via <Link href="https://get.lemlist.com/glt9nlkvruwf" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 font-medium hover:underline">Lemlist</Link></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>DNS anti-spam</strong> : mise en place d'un domaine dédié via <Link href="https://zapmail.ai?via=corentin" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 font-medium hover:underline">Zapmail</Link> pour améliorer la délivrabilité</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Lancement et itération</strong> : configuration des campagnes, suivi des performances et optimisation continue</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Données extractibles - Format amélioré */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-semibold text-xl tracking-tighter text-neutral-900 dark:text-neutral-100">
                Données extractibles :
              </h2>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {(() => {
                  // Priorité : colonnes de l'exemple personnalisé > dataExtracted
                  const count = personalizedData?.dataExample?.columns?.length || caseStudy.dataExtracted?.length || 0
                  return `${count} ${count === 1 ? 'type de données' : 'types de données'}`
                })()}
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              Voici les principales données que vous pouvez extraire automatiquement depuis {caseStudy.examples.slice(0, 2).join(' et ')} et autres sources similaires. Chaque projet est personnalisé pour extraire exactement les données dont vous avez besoin pour votre activité en {caseStudy.sector.toLowerCase()}.
            </p>
            
            {/* Exemple visuel de données extraites - Style amélioré */}
            {personalizedData?.dataExample && (
              <div className="mb-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Exemple de données extraites
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                        {personalizedData.dataExample.columns.map((col, idx) => (
                          <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {personalizedData.dataExample.sampleRows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium">Format de livraison :</span> CSV, Excel, JSON ou API
                  </p>
                </div>
              </div>
            )}

            {/* Liste des données extractibles - Style amélioré */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 uppercase tracking-wider">
                Types de données disponibles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {caseStudy.dataExtracted.map((data, index) => (
                  <div key={index} className="group flex items-start gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">{data}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA secondaire dans Données extractibles */}
            <div className="p-6 rounded-lg text-center border border-neutral-200 dark:border-neutral-800">
              <p className="text-base font-medium mb-3 text-neutral-900 dark:text-neutral-100">
                Besoin de ces données pour votre projet ?
              </p>
              <p className="text-sm mb-4 text-neutral-600 dark:text-neutral-400">
                On échange sur vos besoins spécifiques lors d'un appel de 20 minutes gratuit
              </p>
              <button
                onClick={openCalendly}
                className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:ring-offset-2 transition-colors font-medium"
                aria-label="Réserver un appel gratuit pour échanger sur votre projet"
              >
                On échange ?
              </button>
            </div>
          </div>
        </section>

        {/* Bénéfices business - Format amélioré */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Bénéfices pour votre business
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              {personalizedData?.benefits?.intro || `Le scraping automatisé pour le secteur ${caseStudy.sector.toLowerCase()} vous apporte des avantages concrets et mesurables. Découvrez comment cette solution peut transformer votre façon de travailler et accélérer votre croissance.`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStudy.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exemples de sources - Format amélioré */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Sources de données
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Voici quelques exemples de sources où ces données peuvent être extraites. Chaque source est analysée pour garantir la qualité et la fraîcheur des données extraites. D'autres sources peuvent être ajoutées selon vos besoins spécifiques.
            </p>
            <div className="flex flex-wrap gap-3">
              {caseStudy.examples.map((example, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium border border-neutral-200 dark:border-neutral-700"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline/Délais visuel */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Délais et planning
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Un planning transparent et respecté pour vous garantir une livraison dans les temps :
            </p>
            <div className="relative">
              {/* Ligne horizontale en pointillés - Light mode */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2 dark:hidden" style={{ background: 'repeating-linear-gradient(to right, transparent 0, transparent 4px, rgb(212 212 212) 4px, rgb(212 212 212) 8px)' }}></div>
              {/* Ligne horizontale en pointillés - Dark mode */}
              <div className="hidden md:dark:block absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2" style={{ background: 'repeating-linear-gradient(to right, transparent 0, transparent 4px, rgb(64 64 64) 4px, rgb(64 64 64) 8px)' }}></div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">J+1</div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Devis personnalisé</p>
                </div>
                <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">J+2-4</div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Développement scraper</p>
                </div>
                <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">J+5-6</div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Extraction données</p>
                </div>
                <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">J+7</div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Livraison finale</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section className="mb-16">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Ce qu'en disent les clients
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Découvrez les retours de clients qui ont utilisé le scraping et l'automatisation. 424+ projets réalisés avec 270+ avis positifs sur Malt et Fiverr.
            </p>
            <div className="space-y-6">
              {selectedTestimonials.map((testimonial, index) => (
                <div key={index}>
                  <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                        {testimonial.tags || 'Témoignage client'}
                      </p>
                    </div>
                    <div className="mb-4">
                      <p className="text-neutral-900 dark:text-neutral-100 italic leading-relaxed">
                        "{testimonial.reviewBody}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {testimonial.authorName}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-500">
                          {testimonial.authorJob}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        testimonial.source === 'Fiverr' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : testimonial.source === 'Malt'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
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
                        name: siteConfig.author,
                        url: siteConfig.url
                      },
                      datePublished: testimonial.datePublished,
                      reviewBody: testimonial.reviewBody,
                      ratingValue: testimonial.ratingValue,
                      itemReviewed: {
                        '@type': 'Product',
                        name: caseStudy.title,
                        description: `Service de scraping et automatisation pour ${caseStudy.sector.toLowerCase()}`,
                        url: pageUrl,
                        image: getCaseStudyImage(caseStudy, personalizedData),
                        brand: {
                          '@type': 'Person',
                          name: siteConfig.author,
                          url: siteConfig.url
                        },
                        offers: {
                          '@type': 'Offer',
                          price: '500',
                          priceCurrency: 'EUR',
                          availability: 'https://schema.org/InStock',
                          priceValidUntil: getPriceValidUntil(),
                          priceSpecification: {
                            '@type': 'UnitPriceSpecification',
                            price: '500',
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
            <div className="mt-6 text-center">
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
          </div>
        </section>

        {/* Articles de blog pertinents */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
              <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
                Articles sur ce sujet
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                Pour aller plus loin, découvrez mes articles sur le scraping et l'automatisation pour {caseStudy.sector.toLowerCase()} :
              </p>
              <div className="space-y-4">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block py-3 border-b border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors mb-1">
                          {post.title}
                        </h3>
                        {post.metaDescription && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                            {post.metaDescription}
                          </p>
                        )}
                      </div>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0 mt-1">
                        <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/blog"
                  className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  Voir tous les articles
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Outils et bases de données pertinents */}
        {relatedTools && relatedTools.length > 0 && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
              <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
                Outils et bases de données disponibles
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                Si vous cherchez des données déjà extraites et prêtes à l'emploi, découvrez mes bases de données disponibles pour {caseStudy.sector.toLowerCase()} :
              </p>
              <div className="space-y-4">
                {relatedTools.map((tool) => (
                  <Link
                    key={tool.link}
                    href={tool.link}
                    className="group flex items-center justify-between py-3 border-b border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors mb-1">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-500">
                        {tool.category}
                      </p>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0">
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/marketplace"
                  className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  Voir la marketplace complète
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA principal - Style marketplace */}
        <section className="mb-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center" aria-label="Contact">
          <div className="flex flex-col items-center mb-8">
            <div 
              className="relative inline-block mb-4 group cursor-pointer p-[2px] rounded-full"
              onClick={handleVideoClick}
            >
              <svg 
                className="absolute inset-0"
                style={{ 
                  width: 'calc(100% + 4px)', 
                  height: 'calc(100% + 4px)',
                  margin: '-2px',
                  transform: 'rotate(-90deg)'
                }}
                viewBox="0 0 70 70"
              >
                <defs>
                  <linearGradient id="instagram-gradient-cas-usage-detail" x1="0%" y1="0%" x2="100%" y2="100%">
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
                  stroke={videoSeen ? "#a3a3a3" : "url(#instagram-gradient-cas-usage-detail)"}
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
              <div className="rounded-full bg-white dark:bg-neutral-900 p-[2px]">
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
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/70 dark:bg-neutral-900/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
            
            <h2 className="font-semibold text-2xl mb-4 tracking-tighter text-neutral-900 dark:text-neutral-100">Intéressé par ce cas d'usage ?</h2>
          </div>
          
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
            On échange lors d'un appel de 20 minutes gratuit. Je vous expliquerai comment adapter cette solution à vos besoins spécifiques pour {caseStudy.sector.toLowerCase()}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={openCalendly}
              className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:ring-offset-2 transition-colors font-medium"
              aria-label="Réserver un appel gratuit pour échanger sur votre projet"
            >
              On échange ?
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

        {/* FAQ */}
        <section className="mb-12" aria-labelledby="faq-heading">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <h2 id="faq-heading" className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Questions fréquentes
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Retrouvez les réponses aux questions les plus fréquentes sur le scraping pour {caseStudy.sector.toLowerCase()}. Si votre question n'est pas couverte, n'hésitez pas à me contacter.
            </p>
            <FAQ items={faqItems} />
          </div>
        </section>

        {/* Cas d'usage similaires */}
        {relatedCaseStudies.length > 0 && (
          <section className="mb-16">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
              <h2 className="font-semibold text-2xl mb-8 tracking-tighter text-neutral-900 dark:text-neutral-100">
                Autres cas d'usage en {caseStudy.sector}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                Découvrez d'autres cas d'usage de scraping et automatisation pour {caseStudy.sector.toLowerCase()} :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedCaseStudies.map(related => {
                  const relatedUrl = `/cas-usage/${sectorSlug}/${related.slug}`
                  return (
                    <Link
                      key={related.slug}
                      href={relatedUrl}
                      className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                      prefetch={true}
                      onMouseEnter={() => {
                        // Prefetch au hover pour améliorer la navigation
                        if (typeof window !== 'undefined' && router) {
                          router.prefetch(relatedUrl)
                        }
                      }}
                    >
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2 mb-3">
                        {related.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
                        <span>{related.dataExtracted?.length || 0} types de données</span>
                        {related.examples.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{related.examples[0]}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href={`/cas-usage/${sectorSlug}`}
                  className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  Voir tous les cas d'usage {caseStudy.sector.toLowerCase()}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Retour */}
        <section className="mb-16">
          <Link
            href="/cas-usage"
            className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à tous les cas d'usage
          </Link>
        </section>
      </main>
    </>
  )
}

export async function getStaticPaths() {
  // Ne pas pré-générer toutes les pages (6577 pages = trop long)
  // On utilise fallback: 'blocking' pour générer à la demande
  // Les pages seront générées au premier accès et mises en cache
  
  return {
    paths: [], // Aucune page pré-générée, tout sera généré à la demande
    fallback: true // Affiche le skeleton pendant la génération
  }
}

export async function getStaticProps({ params }) {
  // Vérifier que le secteur correspond au case study
  const sector = slugToSector(params.sector)
  
  if (!sector) {
    return {
      notFound: true
    }
  }
  
  // Imports dynamiques pour réduire le temps de compilation
  let blobModule, localModule
  try {
    blobModule = await import('../../../lib/case-studies-blob')
    localModule = await import('../../../lib/case-studies')
  } catch (error) {
    console.error('❌ Erreur lors du chargement des modules:', error.message)
    return {
      notFound: true
    }
  }
  
  const getCaseStudyBySlug = blobModule.getCaseStudyBySlug
  const getRelatedCaseStudies = blobModule.getRelatedCaseStudies
  const getCaseStudiesBySector = blobModule.getCaseStudiesBySector
  const getPersonalizedData = blobModule.getPersonalizedData
  
  const getCaseStudyBySlugLocal = localModule.getCaseStudyBySlug
  const getRelatedCaseStudiesLocal = localModule.getRelatedCaseStudies
  const getCaseStudiesBySectorLocal = localModule.getCaseStudiesBySector
  
  // Charger depuis Blob Storage avec fallback robuste
  let caseStudy = null
  let loadedFromBlob = false
  
  try {
    caseStudy = await getCaseStudyBySlug(params.slug)
    loadedFromBlob = !!caseStudy
    // Si Blob Storage ne retourne rien, essayer le fallback local
    if (!caseStudy) {
      console.warn(`⚠️ Case study "${params.slug}" non trouvé dans Blob Storage, fallback vers fichier local`)
      caseStudy = getCaseStudyBySlugLocal(params.slug)
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors du chargement depuis Blob Storage, fallback vers fichier local:', error.message)
    // Fallback vers fichier local en cas d'erreur
    try {
      caseStudy = getCaseStudyBySlugLocal(params.slug)
    } catch (localError) {
      console.error('❌ Erreur lors du fallback local:', localError.message)
    }
  }
  
  if (!caseStudy) {
    console.error(`❌ Case study non trouvé: slug="${params.slug}", sector="${params.sector}", loadedFromBlob=${loadedFromBlob}`)
    return {
      notFound: true
    }
  }
  
  // Vérifier que le secteur correspond bien au case study
  if (caseStudy.sector !== sector) {
    console.error(`❌ Secteur ne correspond pas: attendu="${sector}", trouvé="${caseStudy.sector}", slug="${params.slug}"`)
    return {
      notFound: true
    }
  }

  // Récupérer les données personnalisées depuis Blob Storage
  let personalizedData = null
  try {
    personalizedData = await getPersonalizedData(params.slug)
  } catch (error) {
    console.warn('⚠️ Erreur lors de la récupération des données personnalisées:', error.message)
  }

  // Récupérer les cas d'usage similaires
  let relatedCaseStudies = []
  try {
    relatedCaseStudies = await getRelatedCaseStudies(params.slug, 4)
  } catch (error) {
    console.warn('⚠️ Erreur lors de la récupération des cas similaires, fallback:', error.message)
    relatedCaseStudies = getRelatedCaseStudiesLocal(params.slug, 4)
  }

  // Calculer les vues et déterminer si populaire (top 3)
  // Optimisé : timeout de 2 secondes max pour éviter de bloquer la génération
  const VIEWS_EVENTS_FILENAME = 'case-studies-views-events.json'
  let views = 0
  let isPopular = false
  
  try {
    // Timeout pour éviter de bloquer la génération trop longtemps
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    )
    
    const fetchPromise = (async () => {
      const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === VIEWS_EVENTS_FILENAME)

      if (existingBlob) {
        const response = await fetch(existingBlob.url, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const events = await response.json()
          const eventsArray = Array.isArray(events) ? events : []
          
          // Calculer les vues pour ce case study
          views = eventsArray.filter(event => event.slug === params.slug).length
          
          // Calculer les vues pour tous les case studies du même secteur
          let sectorCaseStudies = []
          try {
            sectorCaseStudies = await getCaseStudiesBySector(sector)
          } catch (error) {
            sectorCaseStudies = getCaseStudiesBySectorLocal(sector)
          }
          const viewsMap = {}
          eventsArray.forEach(event => {
            if (event.slug) {
              viewsMap[event.slug] = (viewsMap[event.slug] || 0) + 1
            }
          })
          
          // Trier par vues et vérifier si dans le top 3
          const caseStudiesWithViews = sectorCaseStudies.map(cs => ({
            ...cs,
            views: viewsMap[cs.slug] || 0
          }))
          
          const sorted = caseStudiesWithViews
            .sort((a, b) => {
              if (b.views !== a.views) {
                return b.views - a.views
              }
              return a.title.localeCompare(b.title)
            })
            .slice(0, 3)
          
          isPopular = sorted.some(cs => cs.slug === params.slug)
        }
      }
    })()
    
    await Promise.race([fetchPromise, timeoutPromise])
  } catch (error) {
    // Silencieux en cas de timeout ou d'erreur - on continue sans les vues
    if (error.message !== 'Timeout') {
      console.warn('Erreur lors du calcul des vues:', error)
    }
  }

  // Trouver des articles de blog pertinents par keywords
  // On charge les articles de manière asynchrone côté client pour ne pas bloquer le rendu initial
  // Cela améliore significativement le temps de chargement de la page
  let relatedPosts = []

  // Trouver des outils/databases pertinents par secteur ou keywords
  let relatedTools = []
  try {
    const sectorLower = caseStudy.sector.toLowerCase()
    const keywordsLower = caseStudy.keywords.map(k => k.toLowerCase())
    
    relatedTools = tools
      .filter(tool => {
        const toolCategoryLower = (tool.category || '').toLowerCase()
        const toolDescLower = (tool.description || '').toLowerCase()
        const toolNameLower = (tool.name || '').toLowerCase()
        
        // Vérifier si le secteur ou les keywords correspondent
        return sectorLower.includes(toolCategoryLower) ||
               toolCategoryLower.includes(sectorLower) ||
               keywordsLower.some(keyword => 
                 toolDescLower.includes(keyword) ||
                 toolNameLower.includes(keyword)
               )
      })
      .slice(0, 3)
  } catch (error) {
    console.warn('Erreur lors de la récupération des outils:', error)
  }

  return {
    props: {
      caseStudy,
      relatedCaseStudies,
      relatedPosts: relatedPosts.map(p => ({
        slug: p.slug,
        title: p.title,
        metaDescription: p.metaDescription
      })),
      relatedTools: relatedTools.map(t => ({
        name: t.name,
        category: t.category,
        link: t.link
      })),
      views,
      isPopular
    },
    revalidate: 3600 // Revalider toutes les heures
  }
}
