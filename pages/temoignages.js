import Link from 'next/link'
import Image from 'next/image'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

// Fonction helper pour obtenir le logo d'une entreprise
const getCompanyLogo = (companyName) => {
  if (!companyName) return null
  const nameLower = companyName.toLowerCase()
  
  // Mapping des entreprises aux logos disponibles
  const logoMap = {
    'ngi': '/images/logos/ngi.png',
    'inovesta': '/images/logos/vibe-2025-07-01.webp', // À ajuster si tu as le logo Inovesta
    'kent': '/images/logos/lloyd & davis.png', // À ajuster si tu as le logo Kent
    'assursafe': '/images/logos/assursafe.jpeg',
    'parallel': '/images/logos/vibe-2025-07-01.webp', // À ajuster si tu as le logo Parallel
    'canopée': '/images/logos/vibe-2025-07-01.webp', // À ajuster si tu as le logo Canopée
    'inxpress': '/images/logos/vibe-2025-07-01.webp', // À ajuster si tu as le logo InXpress
    'biche-renard': '/images/logos/vibe-2025-07-01.webp', // À ajuster si tu as le logo La Biche-Renard
  }
  
  // Chercher une correspondance partielle
  for (const [key, logo] of Object.entries(logoMap)) {
    if (nameLower.includes(key)) {
      return logo
    }
  }
  
  return null
}

export default function Temoignages() {
  const pageSEO = generatePageSEO({
    title: 'Témoignages Clients - Corentin Robert',
    description: 'Découvrez les témoignages de mes clients sur Malt, Fiverr et LinkedIn. 424+ projets réalisés avec 270+ avis positifs.',
    path: '/temoignages',
    keywords: ['témoignages', 'avis clients', 'recommandations', 'Malt', 'Fiverr', 'LinkedIn']
  })

  // Données des témoignages pour le Review Schema
  const testimonials = [
    {
      authorName: 'Jean Paul Crenn',
      authorJob: 'Dirigeant VUCA Strategy',
      reviewBody: "Cela fait plusieurs missions de scrapping que nous confions à Corentin depuis maintenant 1 an et nous avons toujours été ravis de travailler avec lui tant au niveau de la qualité des résultats que de la rapidité de la livraison. Un point important à souligner, Corentin est également force de proposition et c'est un véritable dialogue qui se construit autour de chacun des projets, en toute fluidité, au bénéfice d'une grande efficience. Nous recommandons Vivement.",
      source: 'Fiverr',
      ratingValue: '5',
      datePublished: '2025-01-03'
    },
    {
      authorName: 'Adnane Amahou',
      authorJob: 'Responsable CX @ NGI',
      reviewBody: "J'ai eu le plaisir de travailler avec Corentin dans le cadre de l'automatisation de plusieurs tâches. Très à l'écoute, il a su comprendre et détecter nos besoins immédiatement, avec une vraie capacité d'analyse et une grande efficacité dans la mise en œuvre. Super compétent, réactif et force de proposition, Corentin a clairement apporté de la valeur dès le départ.",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2024-01-15'
    },
    {
      authorName: 'lampro74',
      authorJob: 'Belgique',
      reviewBody: "Corentin did an excellent job and my cooperation with him was smooth and easy. He delivered what he promised, he was very open and quick to discuss revisions and delivered even them in no time. My project was not a simple one, as it required collecting information from different places. I'm 100% satisfied with the result.",
      source: 'Fiverr',
      ratingValue: '5',
      datePublished: '2024-01-10'
    },
    {
      authorName: 'Mohamed-Amine Zaghdoud',
      authorJob: 'Fondateur Kent',
      reviewBody: "Prestation de scraping impeccable : compréhension rapide du besoin, extraction propre et structurée, délais respectés. Les données livrées sont exploitables immédiatement (format clair, colonnes cohérentes, pas de doublons). Communication fluide et réactif tout au long du projet.",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2024-01-05'
    },
    {
      authorName: 'Denis',
      authorJob: 'Inovesta',
      reviewBody: "Très professionnel dans les échanges et a respecté à la fois la demande et les délais. Corentin a aussi été très clair sur ce qu'il allait faire dès le départ, évitant les déceptions ou mauvaises surprises. Je recommande.",
      source: 'Malt',
      ratingValue: '5',
      datePublished: '2023-12-20'
    },
    {
      authorName: 'Hugues Chavrier',
      authorJob: 'Président @ Assursafe',
      reviewBody: "Nous avons travaillé à plusieurs reprises avec Corentin qui est très professionnel, rigoureux et à l'écoute de nos besoins. Je le recommande !",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2023-12-15'
    },
    {
      authorName: 'tigerparts',
      authorJob: 'Pays-Bas',
      reviewBody: "Corentin has been exceptionally fast at delivering that order. Great level of expertise! Kudos Corentin.",
      source: 'Fiverr',
      ratingValue: '5',
      datePublished: '2023-12-10'
    },
    {
      authorName: 'Chris Rydahl',
      authorJob: 'Cofounder & CTO @ Parallel',
      reviewBody: "Je recommande vivement Corentin pour sa réactivité et son professionnalisme. J'ai eu la chance de faire appel à lui à deux reprises, et à chaque fois, son accompagnement a été exemplaire.",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2023-12-05'
    },
    {
      authorName: 'Charlotte',
      authorJob: 'Agence Canopée',
      reviewBody: "Corentin est très pro. Il connait son métier, est de très bon conseils, et force de proposition.",
      source: 'Malt',
      ratingValue: '5',
      datePublished: '2023-11-25'
    },
    {
      authorName: 'Julien Vabre',
      authorJob: 'Dirigeant InXpress Gironde',
      reviewBody: "Nous travaillons avec Corentin depuis plus de 3 ans. Il a toujours été de très bons conseils, réactif et appliqué. Je recommande à 💯 % !",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2023-11-20'
    },
    {
      authorName: 'jma225845',
      authorJob: 'France',
      reviewBody: "Nous sommes extrêmement satisfaits du travail réalisé. Corentin a fait preuve d'un grand professionnalisme, d'une excellente réactivité et d'un sens du détail remarquable. La communication a toujours été fluide et agréable, et le résultat final dépasse largement nos attentes.",
      source: 'Fiverr',
      ratingValue: '5',
      datePublished: '2023-11-15'
    },
    {
      authorName: 'Arthur Dalaise',
      authorJob: 'Co-fondateur @ La Biche-Renard',
      reviewBody: "Corentin est redoutablement efficace, il comprend vite et travaille vite. Un plaisir.",
      source: 'LinkedIn',
      ratingValue: '5',
      datePublished: '2023-11-10'
    },
    {
      authorName: 'buzzinsider',
      authorJob: 'États-Unis',
      reviewBody: "For any scraping needs, he is amazing, was able to scrape 400K companies from a complex site.",
      source: 'Fiverr',
      ratingValue: '5',
      datePublished: '2023-11-05'
    }
  ]

  return (
    <>
      <SEOHead {...pageSEO} />
      
      {/* Review Schema 5* par défaut pour la page */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'Service',
            name: 'Services de Scraping et Automatisation',
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
          reviewBody: '424+ projets réalisés avec 270+ avis positifs. Expert freelance scraping et automatisation. Livraison en 7 jours, résultats garantis.',
          datePublished: new Date().toISOString().split('T')[0]
        }}
      />
      
      <StructuredData type="AggregateRating" data={{
        ratingValue: '5',
        reviewCount: '270',
        bestRating: '5',
        worstRating: '1'
      }} />
      {/* Review Schema pour chaque témoignage */}
      {testimonials.map((testimonial, index) => (
        <StructuredData
          key={index}
          type="Review"
          data={{
            author: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            },
            reviewBody: testimonial.reviewBody,
            ratingValue: testimonial.ratingValue,
            datePublished: testimonial.datePublished,
            serviceName: 'Services de Scraping et Automatisation'
          }}
        />
      ))}
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-16">
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Témoignages</h1>
          <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Retours de mes clients sur Malt, Fiverr et LinkedIn. 424+ projets réalisés avec 270+ avis positifs.
          </p>
        </section>

        {/* Section Témoignages */}
        <section className="mb-16">
          <div className="space-y-6">
            {/* Fiverr - JP */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">1 an de collaboration • Qualité • Rapidité • Force de proposition</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Cela fait plusieurs missions de scrapping que nous confions à Corentin depuis maintenant 1 an et nous avons toujours été ravis de travailler avec lui tant au niveau de la qualité des résultats que de la rapidité de la livraison. Un point important à souligner, Corentin est également force de proposition et c'est un véritable dialogue qui se construit autour de chacun des projets, en toute fluidité, au bénéfice d'une grande efficience. Nous recommandons Vivement."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Jean Paul Crenn</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Dirigeant VUCA Strategy</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">Fiverr</span>
              </div>
            </div>
            {/* LinkedIn */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Automatisation • Compréhension immédiate • Valeur apportée dès le départ</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "J'ai eu le plaisir de travailler avec Corentin dans le cadre de l'automatisation de plusieurs tâches. Très à l'écoute, il a su comprendre et détecter nos besoins immédiatement, avec une vraie capacité d'analyse et une grande efficacité dans la mise en œuvre. Super compétent, réactif et force de proposition, Corentin a clairement apporté de la valeur dès le départ."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Adnane Amahou</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Responsable CX @ NGI</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
              </div>
            </div>
            {/* Fiverr */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Projet complexe • Révisions rapides • 100% satisfait</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Corentin did an excellent job and my cooperation with him was smooth and easy. He delivered what he promised, he was very open and quick to discuss revisions and delivered even them in no time. My project was not a simple one, as it required collecting information from different places. I'm 100% satisfied with the result."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">lampro74</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Belgique</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">Fiverr</span>
              </div>
            </div>
            {/* LinkedIn */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Délais respectés • Données exploitables immédiatement • Communication fluide</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Prestation de scraping impeccable : compréhension rapide du besoin, extraction propre et structurée, délais respectés. Les données livrées sont exploitables immédiatement (format clair, colonnes cohérentes, pas de doublons). Communication fluide et réactif tout au long du projet."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Mohamed-Amine Zaghdoud</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Fondateur Kent</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
              </div>
            </div>
            {/* Malt */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Délais respectés • Clarté dès le départ • Professionnalisme</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Très professionnel dans les échanges et a respecté à la fois la demande et les délais. Corentin a aussi été très clair sur ce qu'il allait faire dès le départ, évitant les déceptions ou mauvaises surprises. Je recommande."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Denis</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Inovesta</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">Malt</span>
              </div>
            </div>
            {/* LinkedIn */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Plusieurs missions • Professionnel • À l'écoute</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Nous avons travaillé à plusieurs reprises avec Corentin qui est très professionnel, rigoureux et à l'écoute de nos besoins. Je le recommande !"
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Hugues Chavrier</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Président @ Assursafe</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
              </div>
            </div>
            {/* Fiverr */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Livraison exceptionnellement rapide • Grande expertise</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Corentin has been exceptionally fast at delivering that order. Great level of expertise! Kudos Corentin."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">tigerparts</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Pays-Bas</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">Fiverr</span>
              </div>
            </div>
            {/* LinkedIn */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">2 missions • Réactivité • Accompagnement exemplaire</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Je recommande vivement Corentin pour sa réactivité et son professionnalisme. J'ai eu la chance de faire appel à lui à deux reprises, et à chaque fois, son accompagnement a été exemplaire."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Chris Rydahl</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Cofounder & CTO @ Parallel</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
              </div>
            </div>
            
            {/* Call-to-Action au milieu */}
            <div className="my-12 py-8 text-center border-t border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="font-semibold text-xl mb-4 tracking-tighter">Démarrons votre projet ensemble</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Discutons de votre projet et voyons comment je peux vous aider à le concrétiser.
              </p>
              <Link 
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Réserver un créneau
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                </svg>
              </Link>
            </div>
            
            {/* Malt */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Expertise • Conseils • Force de proposition</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Corentin est très pro. Il connait son métier, est de très bon conseils, et force de proposition."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Charlotte</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Agence Canopée</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">Malt</span>
              </div>
            </div>
            {/* LinkedIn */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">3+ ans de collaboration • Conseils • Réactivité</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Nous travaillons avec Corentin depuis plus de 3 ans. Il a toujours été de très bons conseils, réactif et appliqué. Je recommande à 💯 % !"
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Julien Vabre</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Dirigeant InXpress Gironde</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
              </div>
            </div>
            {/* Fiverr */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Résultat dépasse attentes • Communication fluide • Professionnalisme</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Nous sommes extrêmement satisfaits du travail réalisé. Corentin a fait preuve d'un grand professionnalisme, d'une excellente réactivité et d'un sens du détail remarquable. La communication a toujours été fluide et agréable, et le résultat final dépasse largement nos attentes."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">jma225845</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">France</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">Fiverr</span>
              </div>
            </div>
            {/* LinkedIn */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Efficacité • Compréhension rapide • Travail rapide</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "Corentin est redoutablement efficace, il comprend vite et travaille vite. Un plaisir."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Arthur Dalaise</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">Co-fondateur @ La Biche-Renard</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">LinkedIn</span>
              </div>
            </div>
            {/* Fiverr */}
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">400K entreprises scrapées • Site complexe • Expertise scraping</p>
              </div>
              <div className="mb-4">
                <p className="text-neutral-900 dark:text-neutral-100 italic">
                  "For any scraping needs, he is amazing, was able to scrape 400K companies from a complex site."
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">buzzinsider</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">États-Unis</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">Fiverr</span>
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center flex flex-col items-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                <strong>167 projets</strong> réalisés sur Malt avec <strong>107 avis</strong>
              </p>
              <a 
                href={siteConfig.social.malt}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm border border-pink-200 dark:border-pink-800 rounded-lg hover:border-pink-300 dark:hover:border-pink-700 transition-colors group text-pink-700 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300"
              >
                Voir tous les témoignages sur Malt
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                </svg>
              </a>
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 whitespace-nowrap">
                <strong>103 avis</strong> sur Fiverr • <strong>4,9/5</strong> • <strong>257 commandes</strong>
              </p>
              <a 
                href={siteConfig.social.fiverr}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm border border-green-200 dark:border-green-800 rounded-lg hover:border-green-300 dark:hover:border-green-700 transition-colors group text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              >
                Voir tous les témoignages sur Fiverr
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
