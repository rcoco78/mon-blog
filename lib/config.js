// Configuration centralisée du site
const PROFILE_IMAGE = '/images/profile-picture/pp-corentin-robert.jpg'

/** Preuves sociales Malt (profil public — source de vérité) */
const MALT_PROOF = {
  rating: 5,
  reviews: 115,
  projects: 183,
}

/** Preuves sociales Fiverr (profil public — source de vérité) */
const FIVERR_PROOF = {
  rating: 4.9,
  reviews: 173,
  projects: 265,
}

export const siteConfig = {
  url: 'https://www.corentinrobert.fr',
  name: 'Corentin Robert',
  title: 'Corentin Robert — Freelance scraping & automatisation',
  description:
    'Freelance scraping, automatisation et data. Missions Malt/Fiverr, scrapers Apify, marketplace de bases Google Sheets. Journal de bord public.',
  author: 'Corentin Robert',
  profileImage: PROFILE_IMAGE,
  ogImage: 'https://www.corentinrobert.fr/og-image.jpg',
  ogLogo: `https://www.corentinrobert.fr${PROFILE_IMAGE}`,
  twitter: {
    handle: '@corentinrobert',
    site: '@corentinrobert'
  },
  social: {
    linkedin: 'https://www.linkedin.com/in/robertcorentin/',
    malt: 'https://www.malt.fr/profile/growth',
    github: 'https://github.com/rcoco78',
    fiverr: 'https://fr.pro.fiverr.com/sellers/corentinrobert',
    youtube: 'https://www.youtube.com/@corent1robert',
    spotify: '/spotify' // Page musique avec données Spotify en direct
  },
  youtubeChallenge: {
    title: 'Challenge YouTube — 1 vidéo par jour',
    startDate: '2026-08-01',
    startLabel: '1er août 2026',
    description:
      'À partir du 1er août 2026 : une vidéo chaque jour sur le scraping, l’automatisation et le build in public. Suivez le défi en direct sur ma chaîne.',
    cta: 'S’abonner sur YouTube',
  },
  socialProof: {
    malt: MALT_PROOF,
    fiverr: FIVERR_PROOF,
  },
  homepage: {
    topPostsCount: 3,
    // Positionnement principal du site (crédibilité + journal de bord)
    positioning:
      'Scraping, automatisation et data pour générer du business — journal de bord public de ce que je construis.',
    // Cas d'usage premium affichés manuellement (pas les plus vus auto)
    featuredCaseStudySlugs: [
      'scraping-zillow-extraction-des-donnees-immobilieres',
      'scraping-linkedin-recherche-de-profils-en-masse',
      'scraping-amazon-extraction-des-produits-et-best-sellers',
    ],
    // Articles alignés métier (mots-clés titre / tags / meta)
    businessArticleKeywords: [
      'scraping',
      'automatisation',
      'outbound',
      'freelance',
      'malt',
      'fiverr',
      'apify',
      'linkedin',
      'prospection',
      'data',
      'lead',
      'business',
      'entrepreneur',
      'client',
      'mission',
      'outil',
      'marketplace',
      'base de données',
      'croissance',
      'growth',
    ],
    // Articles à éviter en homepage (lifestyle / voyage)
    lifestyleArticleKeywords: [
      'thaïlande',
      'thailande',
      'voyage',
      'budget voyage',
      'backpack',
      'asie',
      'bali',
      'nomade',
      'lifestyle',
    ],
  },

  metrics: [
    {
      value: String(MALT_PROOF.projects + FIVERR_PROOF.projects),
      label: 'projets réalisés',
      source: 'Malt & Fiverr',
      href: 'https://www.malt.fr/profile/growth',
      breakdown: { malt: MALT_PROOF.projects, fiverr: FIVERR_PROOF.projects },
    },
    {
      value: '20',
      label: 'scrapers publics',
      source: 'sur Apify'
    },
    {
      value: '154',
      label: 'utilisateurs actifs',
      source: 'de mes scrapers'
    },
    {
      value: '242',
      label: 'abonnés',
      source: 'Logement Atypique'
    }
  ],
  projects: [
    {
      id: 'freelance',
      title: 'Freelance scraping & automatisation',
      description: 'Missions scraping & automatisation (Malt, Fiverr, direct) — données livrées pour des dirigeants qui veulent des résultats rapides.',
      link: 'https://www.malt.fr/profile/growth',
      status: 'active',
      featured: true,
      image: PROFILE_IMAGE,
      imageAlt: 'Corentin Robert - Consultant freelance en scraping et automatisation'
    },
    {
      id: 'outreacher',
      title: 'Outreacher',
      description: 'Accompagnement outbound pour équipes commerciales — sales machines et prospection automatisée.',
      link: 'mailto:corentin@outreacher.fr',
      status: 'active',
      featured: true,
      icon: '/images/logo-outreacher.jpeg',
      iconAlt: 'Logo Outreacher - Agence d\'outbound marketing et prospection automatisée'
    },
    {
      id: 'logement-atypique',
      title: 'Logement Atypique',
      description: 'Plateforme de mise en avant de logements d’exception — on photographie et on filme pour leur apporter de la visibilité. Co-fondé avec mon frère.',
      link: 'https://logement-atypique.fr/?utm_source=corentinrobert&utm_medium=website&utm_campaign=homepage',
      status: 'active',
      featured: false,
      icon: '/images/logement-atypique-icon.svg',
      iconAlt: 'Logo Logement Atypique — mise en avant de logements d’exception',
    },

    {
      id: 'contributeurs-apify',
      title: 'Apify',
      description: 'Développement de scrapers publics sur Apify — 20 scrapers disponibles, utilisés par 150+ utilisateurs',
      link: 'https://apify.com?fpr=0n7ukq',
      status: 'active',
      icon: '/images/apify-icon.svg',
      iconAlt: 'Logo Apify - Plateforme de web scraping et automatisation'
    },
    {
      id: 'lemlist',
      title: 'Lemlist',
      description: 'Déploiement et accompagnement sur Lemlist — mise en place de campagnes d\'outbound automatisées',
      link: 'https://get.lemlist.com/glt9nlkvruwf',
      status: 'active',
      icon: '/images/lemlist icon.png',
      iconAlt: 'Logo Lemlist - Outbound marketing automatisé'
    },
    {
      id: 'zapmail',
      title: 'Zapmail',
      description: 'Contributeur et utilisateur — développement de scripts d\'automatisation d\'emails avec IA. Permet un scale de boîte mail avant le lancement de l\'outbound ; très utile pour éviter de tomber en spam si on veut faire du volume.',
      link: 'https://zapmail.ai?via=corentin',
      status: 'active',
      icon: '/images/zapmail_ai_logo.jpeg',
      iconAlt: 'Logo Zapmail - Automatisation d\'emails avec IA'
    },
    {
      id: 'rare-item-club',
      title: 'Rare Item Club',
      description: 'Achat-revente de sneakers "rares" via Vinted, Leboncoin, Ebay',
      link: null,
      status: 'stopped',
      icon: '/images/images.png',
      iconAlt: 'Logo Rare Item Club'
    },
    {
      id: 'instaninja',
      title: 'InstaNinja',
      description: 'Automatisation de compte Instagram — +400 clients total, 10K€ MRR',
      link: null,
      status: 'stopped',
      icon: '/images/getinstaninja_logo.jpeg',
      iconAlt: 'Logo InstaNinja'
    }
  ],
  seo: {
    defaultDescription: 'Corentin Robert — freelance scraping, automatisation et data. Centaines de missions livrées via Malt et Fiverr, scrapers publics sur Apify. Journal de bord public.',
    baseKeywords: [
      'scraping',
      'automatisation',
      'web scraping',
      'freelance scraping',
      'data automation',
      'outbound marketing',
      'growth hacking',
      'Apify',
      'Malt',
      'Corentin Robert'
    ],
    pages: {
      home: {
        title: 'Freelance Scraping & Automatisation',
        description: 'Expert freelance scraping et automatisation. Centaines de missions livrées via Malt et Fiverr, livraison en 7 jours. Journal public, marketplace de bases et scrapers.',
        keywords: ['scraping freelance', 'automatisation', 'consultant scraping', 'web scraping', 'data automation', 'freelance scraping France', 'freelance scraping Paris', 'consultant scraping TPE-PME', 'scraping immobilier', 'automatisation processus business']
      },
      blog: {
        title: 'Articles — scraping, automatisation, freelance',
        description:
          'Articles métier sur le scraping, l’automatisation, l’outbound et le freelance. Journal de ce qui construit ma légitimité terrain.',
        keywords: [
          'blog scraping',
          'articles automatisation',
          'freelance scraping',
          'outbound',
          'growth hacking',
          'data',
          'freelance France',
        ],
      },
      outils: {
        title: 'Marketplace — Bases à acheter · Scrapers Apify free tier',
        description: 'Bases Google Sheets à acheter, scrapers publics Apify en free tier. Même livrables que pour mes clients, en libre-service.',
        keywords: ['marketplace scraping', 'bases de données scraping', 'scrapers Apify gratuits', 'free tier Apify', 'outils automatisation', 'prospection bases Google Sheets']
      },
      aPropos: {
        title: 'À propos',
        description: 'Je scrappe, j’automatise, je livre de la data. Freelance à Paris — ex-growth Airbnb. Missions Malt/Fiverr, Outreacher, marketplace Apify, Logement Atypique.',
        keywords: ['Corentin Robert', 'parcours professionnel', 'expertise scraping', 'freelance', 'growth marketing', 'automatisation', 'freelance scraping Paris', 'consultant scraping TPE-PME']
      },
      donneesPubliques: {
        title: 'Objectifs 2026 — journal public',
        description: 'Journal public de progression métier : CA cumulé freelance, affiliation et projets, suivi en build in public. Scraping, automatisation et data.',
        keywords: ['freelance scraping', 'expert automatisation', 'freelance scraping France', 'consultant scraping', 'objectifs business freelance', 'transparence freelance', 'métriques scraping', 'progression business', 'key results', 'données publiques', 'dashboard progression', 'scraping immobilier', 'scraping santé']
      },
      contact: {
        title: 'Contact — Discutons de votre projet',
        description: 'Contactez-moi pour discuter de votre projet de scraping, d\'automatisation ou d\'outbound marketing. Consultation gratuite de 20 minutes. Réponse sous 24h. Expert scraping Paris, spécialisé immobilier et santé.',
        keywords: ['contact', 'devis scraping', 'consultation', 'projet automatisation', 'contact freelance scraping', 'devis scraping Paris', 'consultation automatisation']
      },
      confidentialite: {
        title: 'Politique de confidentialité',
        description: 'Politique de confidentialité du site Corentin Robert. Données collectées, cookies, finalités et droits RGPD.',
        keywords: ['politique confidentialité', 'RGPD', 'données personnelles', 'cookies']
      }
    }
  }
};

