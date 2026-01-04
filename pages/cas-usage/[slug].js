import { useRouter } from 'next/router'
import Link from 'next/link'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import FAQ from '../../components/FAQ'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'
import { caseStudies, getCaseStudyBySlug, getRelatedCaseStudies } from '../../lib/case-studies'
import { tools } from '../../lib/tools'
import { getAllPosts } from '../../lib/notion'
import { list } from '@vercel/blob'
import { useState, useEffect } from 'react'

export default function CaseStudy({ caseStudy, relatedCaseStudies, relatedPosts, relatedTools }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (router.isFallback) {
    return <div>Chargement...</div>
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

  const pageUrl = `${siteConfig.url}/cas-usage/${caseStudy.slug}`
  const today = new Date().toISOString().split('T')[0]

  // Enrichir la description SEO avec plus de détails et long-tail keywords
  const enrichedDescription = `${caseStudy.description} ${caseStudy.useCase}. Extraction automatisée de données depuis ${caseStudy.examples.slice(0, 3).join(', ')}. Données extractibles : ${caseStudy.dataExtracted.slice(0, 5).join(', ')}. Solution sur-mesure pour ${caseStudy.sector.toLowerCase()}. Délai moyen 7 jours, livraison dans le format de votre choix (CSV, Excel, JSON, API).`

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
      text: `Nous analysons ensemble vos besoins spécifiques en ${caseStudy.sector.toLowerCase()} : quelles données extraire, quelles sources scraper, quel format de livraison. Un devis personnalisé vous est fourni sous 24h.`
    },
    {
      name: 'Développement du scraper',
      text: `Je développe un scraper sur-mesure adapté à vos sources (${caseStudy.examples.slice(0, 2).join(', ')}) et à vos besoins. Le développement inclut la gestion des erreurs, la rotation des proxies et le respect des bonnes pratiques.`
    },
    {
      name: 'Extraction des données',
      text: `L'extraction des données est lancée automatiquement. Les données sont nettoyées, structurées et validées pour garantir leur qualité. Un suivi en temps réel vous permet de suivre l'avancement.`
    },
    {
      name: 'Livraison et support',
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

  // Sélectionner 5-6 témoignages variés (mélange de sources et dates)
  const selectedTestimonials = [
    allTestimonials[0], // JP Crenn - récent, Fiverr
    allTestimonials[1], // Adnane - LinkedIn, automatisation
    allTestimonials[2], // Mohamed-Amine - LinkedIn, scraping
    allTestimonials[3], // Denis - Malt
    allTestimonials[4], // Hugues - LinkedIn, plusieurs missions
    allTestimonials[7] // jma225845 - Fiverr, résultat
  ]

  // Métriques et chiffres clés
  const metrics = [
    { value: '7 jours', label: 'Délai moyen de livraison', icon: '⏱️' },
    { value: '500€+', label: 'Prix à partir de', icon: '💰' },
    { value: '100%', label: 'Données structurées', icon: '✅' },
    { value: '5 formats', label: 'Formats de livraison', icon: '📊' }
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
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '500',
        priceCurrency: 'EUR',
        valueAddedTaxIncluded: true
      }
    },
    datePublished: today,
    dateModified: today
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
      item: `${siteConfig.url}/cas-usage?secteur=${encodeURIComponent(caseStudy.sector)}`
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

      {/* AggregateRating Schema */}
      <StructuredData
        type="AggregateRating"
        data={{
          ratingValue: '5',
          reviewCount: '270',
          bestRating: '5',
          worstRating: '1',
          itemReviewed: {
            '@type': 'Service',
            name: caseStudy.title
          }
        }}
      />

      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        {/* CTA secondaire en haut (sticky sur mobile) */}
        <div className="sticky top-0 z-10 md:hidden mb-6 -mx-4 px-4 py-3 bg-neutral-900 dark:bg-white border-b border-neutral-800 dark:border-neutral-200">
          <button
            onClick={openCalendly}
            disabled={!mounted}
            className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Réserver un appel gratuit
          </button>
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl mb-4">
            {caseStudy.title}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
            {caseStudy.description}
          </p>
          
          {/* Métriques clés - En un coup d'œil */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {metrics.map((metric, index) => (
              <div key={index} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div className="text-2xl mb-1">{metric.icon}</div>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                  {metric.value}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </header>

        {/* Cas d'usage concret - Section mise en avant */}
        <section className="mb-12 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold mb-3 tracking-tighter text-neutral-900 dark:text-neutral-100">
            Cas d'usage concret
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {caseStudy.useCase}
          </p>
        </section>

        {/* Processus étape par étape */}
        <section className="mb-12">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Comment ça fonctionne ?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Processus simple et transparent pour obtenir vos données en 7 jours :
            </p>
            <div className="relative pl-4 sm:pl-6">
              {/* Ligne verticale en pointillés */}
              <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(212 212 212) 4px, rgb(212 212 212) 8px)' }}></div>
              <div className="absolute left-0 top-0 bottom-0 w-[1px] hidden dark:block" style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgb(64 64 64) 4px, rgb(64 64 64) 8px)' }}></div>
              <div className="space-y-6">
                {howToSteps.map((step, index) => (
                  <div key={index} className="relative flex flex-col sm:flex-row sm:gap-4">
                    {/* Point sur la ligne */}
                    <div className="absolute -left-4 sm:-left-6 top-2 w-2 h-2 -translate-x-1/2 rounded-full bg-blue-500 border-2 border-white dark:border-neutral-900 z-10"></div>
                    <div className="w-full sm:w-32 sm:flex-shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-0 pl-0 sm:pl-4">
                      Étape {index + 1}
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
              </div>
            </div>
          </div>
        </section>

        {/* Données extractibles - Format épuré */}
        <section className="mb-12">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Données extractibles
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Voici les principales données que vous pouvez extraire automatiquement depuis {caseStudy.examples.slice(0, 2).join(' et ')} et autres sources similaires. Chaque projet est personnalisé pour extraire exactement les données dont vous avez besoin pour votre activité en {caseStudy.sector.toLowerCase()}.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {caseStudy.dataExtracted.map((data, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-neutral-700 dark:text-neutral-300">{data}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bénéfices business - Format amélioré */}
        <section className="mb-12">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Bénéfices pour votre business
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              L'automatisation du scraping pour {caseStudy.sector.toLowerCase()} vous apporte des avantages concrets et mesurables. Découvrez comment cette solution peut transformer votre façon de travailler et accélérer votre croissance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStudy.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-neutral-700 dark:text-neutral-300 font-medium">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exemples de sources - Format amélioré */}
        <section className="mb-12">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
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
        <section className="mb-12">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
              Délais et planning
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Un planning transparent et respecté pour vous garantir une livraison dans les temps :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">J+1</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Devis personnalisé</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">J+2-4</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Développement scraper</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">J+5-6</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Extraction données</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">J+7</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Livraison finale</p>
              </div>
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section className="mb-12">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
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
                        '@type': 'Service',
                        name: caseStudy.title,
                        url: pageUrl
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
          <section className="mb-12">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
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
          <section className="mb-12">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
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

        {/* CTA principal - Format amélioré */}
        <section className="mb-12 p-6 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border border-neutral-800 dark:border-neutral-200">
          <h2 className="text-xl font-semibold mb-3 tracking-tighter">
            Intéressé par ce cas d'usage ?
          </h2>
          <p className="text-neutral-200 dark:text-neutral-700 mb-4 leading-relaxed">
            Discutons de votre projet lors d'un appel de 20 minutes gratuit. 
            Je vous expliquerai comment adapter cette solution à vos besoins spécifiques et vous fournirai un devis personnalisé. Plus de 424 projets réalisés avec 270+ avis positifs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://calendly.com/corentinrobert/20min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
            >
              Réserver un appel gratuit
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-white/20 dark:border-neutral-800 text-white dark:text-neutral-900 rounded-lg hover:bg-white/10 dark:hover:bg-neutral-100 transition-colors text-sm font-medium"
            >
              Me contacter
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
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
          <section className="mb-12">
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="text-2xl font-semibold mb-6 tracking-tighter text-neutral-900 dark:text-neutral-100">
                Autres cas d'usage en {caseStudy.sector}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                Découvrez d'autres cas d'usage de scraping et automatisation pour {caseStudy.sector.toLowerCase()} :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedCaseStudies.map(related => (
                  <Link
                    key={related.slug}
                    href={`/cas-usage/${related.slug}`}
                    className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                  >
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                      {related.description}
                    </p>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/cas-usage"
                  className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  Voir tous les cas d'usage
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
  const paths = caseStudies.map(cs => ({
    params: { slug: cs.slug }
  }))

  return {
    paths,
    fallback: true
  }
}

export async function getStaticProps({ params }) {
  const caseStudy = getCaseStudyBySlug(params.slug)
  
  if (!caseStudy) {
    return {
      notFound: true
    }
  }

  const relatedCaseStudies = getRelatedCaseStudies(params.slug, 4)

  // Trouver des articles de blog pertinents par keywords
  let relatedPosts = []
  try {
    let allPosts = []
    
    // Essayer depuis Blob Storage
    try {
      const blobs = await list({ prefix: 'blog-posts.json' })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === 'blog-posts.json')
      
      if (existingBlob) {
        const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.posts && Array.isArray(data.posts)) {
            allPosts = data.posts
          }
        }
      }
    } catch (error) {
      console.warn('Erreur Blob Storage, fallback Notion:', error)
    }
    
    // Fallback vers Notion
    if (allPosts.length === 0) {
      allPosts = await getAllPosts()
    }
    
    // Filtrer les articles pertinents par keywords
    const keywordsLower = caseStudy.keywords.map(k => k.toLowerCase())
    relatedPosts = allPosts
      .filter(post => {
        if (!post.tags || post.tags.length === 0) return false
        const postTagsLower = post.tags.map(t => t.toLowerCase())
        const titleLower = (post.title || '').toLowerCase()
        const descLower = (post.metaDescription || '').toLowerCase()
        
        // Vérifier si les tags, titre ou description contiennent des keywords
        return keywordsLower.some(keyword => 
          postTagsLower.some(tag => tag.includes(keyword) || keyword.includes(tag)) ||
          titleLower.includes(keyword) ||
          descLower.includes(keyword)
        )
      })
      .slice(0, 3)
  } catch (error) {
    console.warn('Erreur lors de la récupération des articles:', error)
  }

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
      }))
    },
    revalidate: 3600 // Revalider toutes les heures
  }
}
