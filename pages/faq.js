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
        question: "Qu'est-ce que le scraping et comment ça peut aider mon business ?",
        answer: "Le scraping (ou web scraping) est une technique qui permet d'extraire automatiquement des données depuis des sites web. Concrètement, cela vous permet de : collecter des données concurrentielles (prix, produits, avis), générer des leads qualifiés (contacts, profils LinkedIn), automatiser votre veille marché, enrichir vos bases de données existantes. Par exemple, un agent immobilier peut extraire tous les biens disponibles dans une zone, un e-commerçant peut suivre les prix de ses concurrents, un growth marketeux peut construire des listes de prospects ciblés. L'objectif : transformer des tâches manuelles chronophages en processus automatisés qui tournent 24/7."
      },
      {
        question: "Quel est le ROI réel de l'automatisation pour mon entreprise ?",
        answer: "L'automatisation génère du ROI de plusieurs façons : 1) Gain de temps : libérer 10-20h/semaine de tâches répétitives pour vous concentrer sur la stratégie, 2) Réduction d'erreurs : éliminer les erreurs humaines dans la saisie ou la collecte de données, 3) Scalabilité : traiter 100x plus de données sans augmenter les coûts, 4) Décisions rapides : avoir des données à jour en temps réel pour prendre des décisions éclairées. Exemple concret : un scraper qui collecte les prix concurrents quotidiennement vous fait gagner 5h/semaine et vous permet d'ajuster vos prix en temps réel. Sur un an, c'est 260h économisées + meilleure compétitivité."
      },
      {
        question: "Pourquoi choisir un freelance plutôt qu'une agence ou un dev interne ?",
        answer: "3 avantages clés : 1) Rapidité : livraison en moins d'une semaine vs 1-2 mois pour une agence, 2) Coûts maîtrisés : pas de frais de structure, tarifs transparents, pas de coûts récurrents si vous n'avez pas besoin de maintenance, 3) Expertise ciblée : 448+ projets Malt & Fiverr en scraping/automatisation vs un dev interne qui doit tout apprendre. Un freelance spécialisé apporte aussi flexibilité : vous payez uniquement pour ce dont vous avez besoin, sans engagement long terme. Parfait pour tester une idée rapidement ou traiter un besoin ponctuel."
      },
      {
        question: "Combien coûte un projet de scraping ou d'automatisation ?",
        answer: "Les prix varient selon la complexité, mais voici des ordres de grandeur : un scraping simple (1 site, données structurées) : 500-1500€, un scraping complexe (multi-sites, données dynamiques, anti-bot) : 1500-5000€, une automatisation complète (outil sur-mesure + intégration) : 2000-8000€. La plupart des projets se livrent en moins d'une semaine. Pour un devis précis, je propose un appel de 20 minutes gratuit pour comprendre votre besoin et vous donner un prix exact avec délais. Pas de surprise, tout est transparent dès le départ."
      },
      {
        question: "Est-ce légal de scraper des sites web ?",
        answer: "Oui, le scraping est légal dans la plupart des cas, à condition de respecter : 1) Les robots.txt et conditions d'utilisation du site, 2) Le RGPD si vous collectez des données personnelles, 3) Les bonnes pratiques (ne pas surcharger les serveurs, respecter les limites de taux). Je m'assure toujours que vos projets respectent la légalité. Pour les données publiques (prix, produits, annonces), c'est généralement autorisé. Pour les données personnelles (emails, profils privés), il faut un consentement ou une base légale. On en discute ensemble pour garantir la conformité de votre projet."
      },
      {
        question: "Pourquoi ce blog ?",
        answer: "Ce blog est né d'une volonté de partager mes réflexions sur le scraping, l'automatisation et l'entrepreneuriat. Pas seulement des tutoriels techniques, mais aussi des cas d'usage business, des réflexions sur le métier de freelance, et des retours d'expérience sur mes projets. Vous y trouverez des articles variés : scraping, automatisation, entrepreneuriat, voyage, et bien d'autres sujets qui me passionnent. L'objectif : créer du lien, partager mes apprentissages, et révéler ma personnalité au-delà du simple prestataire."
      }
    ],
    outils: [
      {
        question: "Comment utiliser concrètement vos outils gratuits ?",
        answer: "C'est très simple : 1) Cliquez sur l'outil qui vous intéresse dans la marketplace, 2) Sur la page de l'outil, entrez votre email pour recevoir l'accès (gratuit, sans engagement), 3) Une fois connecté, vous accédez à l'interface de l'outil avec des instructions claires, 4) Utilisez l'outil directement dans votre navigateur, sans installation. Par exemple, le Générateur de Templates d'Emails : vous sélectionnez le type de message (outreach, follow-up, etc.), vous personnalisez le contenu, et vous copiez-collez le template généré. L'Extracteur LinkedIn : vous entrez vos critères de recherche, vous lancez l'extraction, et vous téléchargez les résultats en CSV. Aucune compétence technique requise."
      },
      {
        question: "Les outils sont-ils vraiment gratuits ? Y a-t-il des limites ?",
        answer: "Oui, la plupart des outils sont 100% gratuits, sans limite de temps ni de nombre d'utilisations. Certains outils ont des limites raisonnables pour éviter les abus : l'Extracteur LinkedIn est limité à 50 profils par jour (gratuit), ce qui couvre largement les besoins de prospection d'une TPE-PME. Si vous avez besoin de volumes plus importants, je peux développer une version sur-mesure. Les bases de données payantes (comme Dentistes Parisiens) sont clairement indiquées avec leurs prix. Aucun piège, tout est transparent."
      },
      {
        question: "Puis-je avoir un outil sur-mesure adapté à mon business ?",
        answer: "Absolument ! Si vos besoins sont spécifiques, je développe des outils sur-mesure. Exemples : un extracteur adapté à votre secteur d'activité, un générateur de contenu pour votre industrie, une automatisation de votre workflow spécifique. Le processus : 1) On discute de votre besoin (appel de 20 min gratuit), 2) Je vous propose une solution technique avec devis et délais, 3) Développement et livraison en moins d'une semaine, 4) Formation et support inclus. Tarifs : à partir de 2000€ selon la complexité. Contactez-moi pour discuter de votre projet."
      },
      {
        question: "Quelle est la différence entre l'achat unique et l'abonnement annuel pour les bases de données ?",
        answer: "Les deux options sont au même prix. L'achat unique : vous recevez la base de données une fois, sans mise à jour. L'abonnement annuel : vous recevez la base de données initiale + une mise à jour automatique chaque année (nouvelles données, corrections, enrichissements). Exemple : Base Dentistes Parisiens à 79€ - avec l'abonnement, vous recevez la version 2024 maintenant, puis automatiquement la version 2025 dans un an, puis 2026, etc. L'abonnement est recommandé si vous utilisez les données sur le long terme et voulez garder vos fichiers à jour sans avoir à racheter chaque année."
      },
      {
        question: "Les données des bases de données sont-elles à jour et fiables ?",
        answer: "Oui, toutes les bases de données sont mises à jour régulièrement. La date de dernière mise à jour est indiquée sur chaque page de base de données. Les données sont collectées via scraping automatisé et vérifiées manuellement pour garantir la qualité. Format : CSV, Excel (.xlsx) et JSON disponibles. Chaque base inclut les colonnes essentielles (nom, adresse, téléphone, email, etc.) selon le type de données. Si vous constatez des erreurs ou des données obsolètes, contactez-moi et je mets à jour gratuitement."
      },
      {
        question: "Puis-je intégrer vos outils avec mes outils existants (CRM, Excel, etc.) ?",
        answer: "Oui, la plupart des outils exportent en formats standards (CSV, Excel, JSON) que vous pouvez importer dans n'importe quel CRM (HubSpot, Salesforce, Pipedrive), Excel, Google Sheets, ou base de données. Pour des intégrations automatiques (API, webhooks, Zapier), je peux développer une version sur-mesure qui se connecte directement à vos outils. Exemple : un scraper qui alimente automatiquement votre CRM toutes les semaines, ou un outil qui synchronise avec votre Google Sheets en temps réel. On discute de votre stack technique et je propose la meilleure solution d'intégration."
      },
      {
        question: "Y a-t-il un support si j'ai des questions sur l'utilisation d'un outil ?",
        answer: "Oui, chaque outil dispose d'instructions claires sur sa page dédiée. Si vous avez des questions spécifiques ou rencontrez un problème, contactez-moi directement (email, LinkedIn, ou via Calendly). Je réponds généralement sous 24h. Pour les outils gratuits, le support est inclus. Pour les outils sur-mesure, le support post-livraison est inclus pendant 1 mois, puis disponible en option selon vos besoins."
      }
    ],
    objectifs: [
      {
        question: "Quel est votre délai de livraison réel ?",
        answer: "Livraison en moins d'une semaine pour 90% des projets. Concrètement : un scraping simple (1 site, données structurées) : 2-3 jours, un scraping complexe (multi-sites, anti-bot) : 5-7 jours, une automatisation complète : 5-7 jours. Si votre projet est urgent (livraison en 48h), c'est possible selon ma disponibilité. On en discute lors de l'appel initial. Je privilégie la rapidité sans compromettre la qualité : vous avez vos données rapidement pour pouvoir les exploiter sans attendre."
      },
      {
        question: "Comment garantissez-vous la pérennité de vos solutions ?",
        answer: "Je construis des solutions robustes qui fonctionnent dans le temps : 1) Code maintenable et documenté, 2) Gestion des erreurs et cas limites, 3) Solutions hébergées sur Apify (pour les scrapers publics) qui gèrent l'infrastructure, 4) Documentation complète pour que vous puissiez comprendre et maintenir si besoin. Pour les projets sur-mesure, je propose des options de maintenance (corrections si le site source change, évolutions, support). La plupart des solutions tournent des années sans intervention. Exemple : mes scrapers Apify fonctionnent depuis 2+ ans avec 150+ utilisateurs actifs."
      },
      {
        question: "Quelle est votre capacité et disponibilité pour prendre de nouveaux projets ?",
        answer: "Je traite 20-30 projets par mois avec un suivi rigoureux de chaque mission. Disponibilité : jusqu'à 4 appels de 20 minutes par jour pour discuter de nouveaux projets (réservez via Calendly). Secteurs d'expertise : j'ai une expérience particulière dans l'immobilier et la santé, mais je travaille avec des entreprises de tous secteurs (e-commerce, SaaS, services, etc.). Si votre projet est urgent, on peut s'organiser. Si je suis à capacité, je vous indique un délai réaliste dès le départ. Transparence totale sur les disponibilités."
      },
      {
        question: "Comment se déroule un projet de A à Z ?",
        answer: "Processus en 5 étapes : 1) Appel de 20 minutes (gratuit) : on discute de votre besoin, votre contexte, vos contraintes. Je pose des questions pour bien comprendre. 2) Proposition détaillée : sous 24-48h, je vous envoie une proposition avec approche technique, délais, prix, format de livraison. 3) Validation : vous validez la proposition, on signe (ou pas, selon votre préférence), je démarre. 4) Développement : je code, je teste, je vous tiens informé de l'avancement. 5) Livraison : vous recevez les données/outil + documentation. On fait un point pour s'assurer que tout correspond à vos attentes. Ajustements si nécessaire (inclus)."
      },
      {
        question: "Quel est l'impact concret pour mes clients ?",
        answer: "2 impacts majeurs : 1) Réactivité : vous avez vos données en moins d'une semaine vs 1-2 mois avec une agence. Vous pouvez prendre des décisions rapidement, réagir aux opportunités, lancer vos campagnes sans attendre. 2) Systèmes pérennes : je construis des solutions qui tournent dans le temps. Exemple : un scraper qui collecte les prix concurrents quotidiennement. Une fois livré, il continue de tourner automatiquement. Vous gagnez du temps chaque jour, pas juste une fois. Les solutions Apify que je développe sont utilisées par 150+ personnes, preuve de leur robustesse."
      },
      {
        question: "Proposez-vous un support après la livraison ?",
        answer: "Oui, le support post-livraison est inclus : 1) Ajustements mineurs (corrections, petits changements) : inclus pendant 1 mois après livraison, 2) Support technique : si vous avez des questions sur l'utilisation, je réponds sous 24h, 3) Maintenance optionnelle : si le site source change et casse le scraper, je peux le corriger (tarif selon la complexité). Pour les projets complexes, je propose des packages de maintenance mensuels. L'objectif : que vous soyez autonome, mais je reste disponible si besoin."
      },
      {
        question: "Comment garantissez-vous la confidentialité de mes données ?",
        answer: "Confidentialité totale : 1) Pas de partage : vos données ne sont jamais partagées, vendues ou utilisées à d'autres fins, 2) Sécurité : accès sécurisé aux données, pas de stockage inutile, suppression après livraison si vous le souhaitez, 3) RGPD : respect strict du RGPD pour les données personnelles, 4) Transparence : je vous explique exactement ce que je fais avec vos données. Pour les projets sensibles, on peut signer un NDA. Votre business reste votre business, je suis juste l'outil technique."
      },
      {
        question: "Pourquoi partager publiquement vos objectifs et métriques ?",
        answer: "3 raisons : 1) Transparence et confiance : montrer mes objectifs et ma progression démontre mon engagement envers la transparence. Vous savez où j'en suis, où je vais, comment je travaille. 2) Authenticité : les objectifs ne sont pas toujours atteints, et c'est normal. Montrer les succès comme les défis donne une vision réelle de mon activité. 3) Preuve de crédibilité : 183 projets et 115 avis 5/5 sur Malt, scrapers publics utilisés chaque jour — les chiffres parlent. Vous voyez que je suis actif, que je livre, que les clients sont satisfaits."
      }
    ]
  }

  // Flatten toutes les questions pour le Schema.org
  const allQuestions = Object.values(allFAQs).flat()

  // Questions filtrées selon la catégorie sélectionnée
  const filteredQuestions = selectedCategory 
    ? allFAQs[selectedCategory] || []
    : allQuestions

  // Conversion pour le Schema.org FAQPage (uniquement les questions avec réponses string)
  const faqData = {
    questions: filteredQuestions
      .filter(q => typeof q.answer === 'string')
      .map(q => ({
        question: q.question,
        answer: q.answer
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
      
      {/* Service Schema */}
      <StructuredData
        type="Service"
        data={{
          name: 'Scraping et Automatisation',
          serviceType: 'Web Scraping, Data Automation, Outbound Marketing',
          description: 'Expert freelance en scraping web et automatisation. Services de scraping et automatisation sur-mesure.',
          url: `${siteConfig.url}/faq`
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

