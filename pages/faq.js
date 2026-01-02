import { useState } from 'react'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import FAQ from '../components/FAQ'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Toutes les questions FAQ regroupées par catégorie
  const allFAQs = {
    general: [
      {
        question: "Pourquoi ce blog ?",
        answer: "Ce blog est né d'une volonté de partager mes réflexions sur le scraping, l'automatisation et l'entrepreneuriat. Pas seulement des tutoriels techniques, mais aussi des cas d'usage business, des réflexions sur le métier de freelance, et des retours d'expérience sur mes projets. Vous y trouverez des articles variés : scraping, automatisation, entrepreneuriat, voyage, et bien d'autres sujets qui me passionnent. L'objectif : créer du lien, partager mes apprentissages, et révéler ma personnalité au-delà du simple prestataire."
      },
      {
        question: "Qu'est-ce que le scraping ?",
        answer: "Le scraping (ou web scraping) est une technique qui permet d'extraire automatiquement des données depuis des sites web. C'est utile pour collecter des informations, analyser des tendances, ou automatiser des processus de collecte de données."
      },
      {
        question: "Comment automatiser mes processus business ?",
        answer: "L'automatisation business passe par l'identification des tâches répétitives, la création de scripts ou d'outils automatisés, et l'intégration de ces solutions dans vos workflows. Je partage des cas d'usage concrets et des tutoriels dans mes articles."
      },
      {
        question: "Pourquoi choisir un freelance scraping ?",
        answer: "Un freelance spécialisé en scraping apporte expertise technique, flexibilité et coûts maîtrisés. Avec 424+ projets réalisés, je développe des solutions sur-mesure adaptées à vos besoins business spécifiques."
      }
    ],
    outils: [
      {
        question: "Les outils et bases de données sont-ils gratuits ?",
        answer: "La plupart des outils et bases de données sont gratuits. Je les développe pour partager mon expertise et aider la communauté. Certains outils peuvent avoir des limites d'utilisation (comme l'extracteur LinkedIn limité à 50 profils par jour). Certains produits premium sont disponibles en version payante."
      },
      {
        question: "Comment utiliser ces outils ?",
        answer: "Chaque outil dispose de sa propre page avec des instructions d'utilisation. Cliquez sur un outil pour accéder à sa page dédiée et commencer à l'utiliser immédiatement, sans inscription nécessaire."
      },
      {
        question: "Puis-je avoir un outil sur-mesure ?",
        answer: "Absolument ! Si vous avez besoin d'un outil personnalisé pour votre business, je peux développer une solution sur-mesure adaptée à vos besoins spécifiques. Contactez-moi pour discuter de votre projet."
      },
      {
        question: "Quelle est la différence entre l'achat unique et l'abonnement annuel ?",
        answer: "L'achat unique vous donne un accès immédiat à la base de données sans renouvellement. L'abonnement annuel, au même prix, inclut une mise à jour annuelle du fichier : vous recevrez automatiquement la version actualisée de la base de données chaque année. Les deux options sont au même prix, l'abonnement est recommandé si vous souhaitez garder vos données à jour sur le long terme."
      },
      {
        question: "Comment utiliser cet outil ?",
        answer: "Entrez votre email pour recevoir l'accès à l'outil. Une fois connecté, vous pourrez générer des templates d'emails personnalisés en quelques clics."
      },
      {
        question: "L'outil est-il vraiment gratuit ?",
        answer: "Oui, cet outil est entièrement gratuit. Aucun paiement n'est requis pour l'utiliser."
      },
      {
        question: "Puis-je personnaliser les templates ?",
        answer: "Oui, vous pouvez personnaliser tous les templates selon vos besoins. Si vous avez besoin d'une version sur-mesure, contactez-moi pour discuter de votre projet."
      },
      {
        question: "Y a-t-il des mises à jour ?",
        answer: "Oui, les outils sont mis à jour régulièrement pour améliorer les fonctionnalités et corriger les bugs."
      }
    ],
    objectifs: [
      {
        question: "Pourquoi partager ces objectifs ?",
        answer: "Transparence et confiance : En partageant publiquement mes objectifs et ma progression, je démontre mon engagement envers la transparence et la responsabilité. C'est une façon de construire la confiance avec mes clients et partenaires. Reconnaissance de la réalité : Les objectifs ne sont pas toujours atteints, et c'est normal. Montrer les succès comme les défis permet de donner une vision authentique de mon activité. Inspiration et partage : Ces données peuvent inspirer d'autres entrepreneurs et freelances à adopter une approche similaire de transparence dans leur communication."
      },
      {
        question: "Quel est l'impact pour mes clients ?",
        answer: "Réactivité extrême : Livraison en moins d'une semaine. Je privilégie la rapidité d'exécution pour que vous puissiez exploiter vos données rapidement. Systèmes longue durée : Je construis des solutions pérennes — comme les scrapers Apify — qui fonctionnent dans le temps. Vous gagnez un temps considérable en automatisant des processus répétitifs, et le système continue de tourner même après la livraison."
      },
      {
        question: "Quelle est votre capacité et disponibilité ?",
        answer: "Volume de projets : Je traite jusqu'à 20 à 30 projets par mois, avec un suivi rigoureux de chaque mission. Disponibilité : Je suis disponible pour des missions urgentes et peux adapter mon planning selon vos besoins. Contactez-moi pour discuter de votre projet et de mes disponibilités."
      },
      {
        question: "Quelle est votre méthode de travail ?",
        answer: "Compréhension du besoin : J'analyse en profondeur votre besoin pour proposer la solution la plus adaptée. Développement rapide : Je privilégie la rapidité d'exécution sans compromettre la qualité. Livraison et suivi : Je livre des solutions fonctionnelles et assure un suivi post-livraison pour garantir votre satisfaction."
      }
    ]
  }

  // Flatten toutes les questions pour le Schema.org
  const allQuestions = Object.values(allFAQs).flat()

  // Questions filtrées selon la catégorie sélectionnée
  const filteredQuestions = selectedCategory 
    ? allFAQs[selectedCategory] || []
    : allQuestions

  // Conversion pour le Schema.org FAQPage
  const faqData = {
    questions: filteredQuestions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: typeof q.answer === 'string' ? q.answer : q.answer.toString()
      }
    }))
  }

  const categories = [
    { id: null, label: 'Toutes les questions' },
    { id: 'general', label: 'Général' },
    { id: 'outils', label: 'Outils & Marketplace' },
    { id: 'objectifs', label: 'Objectifs & Méthode' }
  ]

  const pageSEO = generatePageSEO({
    title: 'Questions fréquentes (FAQ) - Corentin Robert',
    description: 'Toutes les questions fréquentes sur le scraping, l\'automatisation, les outils gratuits, la marketplace et mes méthodes de travail. Trouvez rapidement les réponses à vos questions.',
    path: '/faq',
    keywords: ['FAQ', 'questions fréquentes', 'scraping', 'automatisation', 'outils gratuits', 'marketplace']
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData type="FAQPage" data={faqData} />
      
      {/* Review Schema 5* par défaut */}
      <StructuredData
        type="Review"
        data={{
          itemReviewed: {
            '@type': 'WebPage',
            name: 'FAQ - Questions fréquentes',
            url: `${siteConfig.url}/faq`
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5'
          },
          author: {
            '@type': 'Person',
            name: 'Corentin Robert'
          }
        }}
      />
      <StructuredData
        type="AggregateRating"
        data={{
          '@type': 'AggregateRating',
          ratingValue: '5',
          reviewCount: '100',
          bestRating: '5',
          worstRating: '1'
        }}
      />

      <main className="min-w-0 mt-6 flex flex-col">
        <section className="mb-16">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
            Questions fréquentes
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 tracking-tight">
            Retrouvez toutes les réponses aux questions les plus fréquentes sur le scraping, l'automatisation, mes outils gratuits, la marketplace et mes méthodes de travail.
          </p>

          {/* Filtres par catégorie */}
          <div className="mb-8">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Filtrer par catégorie
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id || 'all'}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <FAQ items={filteredQuestions} />
        </section>
      </main>
    </>
  )
}

