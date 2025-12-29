// Configuration centralisée du site
export const siteConfig = {
  url: 'https://www.corentinrobert.fr',
  name: 'Corentin Robert',
  title: 'Corentin Robert - Blog Personnel',
  description: 'Blog personnel de Corentin Robert - Développement web, outils, projets open source et évolutions professionnelles',
  author: 'Corentin Robert',
  ogImage: 'https://www.corentinrobert.fr/og-image.jpg',
  ogLogo: 'https://www.corentinrobert.fr/images/profile.svg',
  twitter: {
    handle: '@corentinrobert',
    site: '@corentinrobert'
  },
  social: {
    linkedin: 'https://www.linkedin.com/in/robertcorentin/',
    malt: 'https://www.malt.fr/profile/growth',
    github: 'https://github.com/rcoco78',
    fiverr: 'https://fr.pro.fiverr.com/sellers/corentinrobert',
    spotify: '/spotify' // Page musique avec données Spotify en direct
  },
  homepage: {
    topPostsCount: 3
  },
  metrics: [
    {
      value: '423',
      label: 'projets réalisés',
      source: 'Malt & Fiverr'
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
      title: 'Scraping & Automatisation',
      description: 'Services de scraping et automatisation pour entreprises — outils sur-mesure et livraison de données',
      link: 'https://www.malt.fr/profile/growth',
      status: 'active',
      image: '/images/profile.jpg',
      imageAlt: 'Corentin Robert - Consultant freelance en scraping et automatisation'
    },
    {
      id: 'logement-atypique',
      title: 'Logement Atypique',
      description: 'Plateforme de référencement de logements d\'exception — tiny houses, villas d\'architecte, châteaux, cabanes',
      link: 'https://logement-atypique.fr/?utm_source=corentinrobert&utm_medium=website&utm_campaign=homepage',
      status: 'active',
      icon: '/images/logement-atypique-icon.svg',
      iconAlt: 'Logo Logement Atypique - Plateforme de logements exceptionnels'
    },
    {
      id: 'outreacher',
      title: 'Outreacher',
      description: 'Agence d\'outbound marketing — création de sales machines automatisées pour générer des leads',
      link: 'mailto:corentin@outreacher.fr',
      status: 'active',
      icon: '/images/logo-outreacher.jpeg',
      iconAlt: 'Logo Outreacher - Agence d\'outbound marketing et prospection automatisée'
    },
    {
      id: 'contributeurs-apify',
      title: 'Contributeurs Apify',
      description: 'Développement de scrapers publics sur Apify — 20 scrapers disponibles, utilisés par 150+ utilisateurs',
      link: 'https://apify.com?fpr=0n7ukq',
      status: 'active',
      icon: '/images/apify-icon.svg',
      iconAlt: 'Logo Apify - Plateforme de web scraping et automatisation'
    },
    {
      id: 'lemlist',
      title: 'Partenaire Lemlist',
      description: 'Déploiement et accompagnement sur Lemlist — mise en place de campagnes d\'outbound automatisées',
      link: 'https://get.lemlist.com/glt9nlkvruwf',
      status: 'active',
      icon: '/images/lemlist icon.png',
      iconAlt: 'Logo Lemlist - Outbound marketing automatisé'
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
    defaultDescription: 'Corentin Robert - Consultant freelance spécialisé en scraping et automatisation. 167 projets réalisés sur Malt, 20 scrapers publics sur Apify. Expertise en outbound marketing et data automation.',
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
        title: 'Corentin Robert - Freelance Scraping & Automatisation',
        description: 'Expert freelance en scraping et automatisation. 424+ projets réalisés via Malt et Fiverr, 20 scrapers publics sur Apify. Expertise en outbound marketing automatisé et data automation pour entreprises.',
        keywords: ['scraping freelance', 'automatisation', 'consultant scraping', 'web scraping', 'data automation', 'freelance scraping France']
      },
      blog: {
        title: 'Blog - Articles sur le Scraping, Automatisation et Growth',
        description: 'Découvrez mes articles sur le scraping web, l\'automatisation, le growth hacking et l\'entrepreneuriat. Conseils pratiques, tutoriels et réflexions sur le développement web.',
        keywords: ['blog scraping', 'articles automatisation', 'growth hacking', 'tutoriels scraping']
      },
      outils: {
        title: 'Outils Gratuits - Scraping, Outreach et Automatisation',
        description: 'Collection d\'outils gratuits pour le scraping, l\'outreach marketing et l\'automatisation. Générateurs de templates, extracteurs de données et outils de productivité.',
        keywords: ['outils scraping', 'outils gratuits', 'outreach marketing', 'automatisation outils']
      },
      aPropos: {
        title: 'À Propos - Parcours et Expertise de Corentin Robert',
        description: 'Découvrez mon parcours de growth marketeux chez Airbnb à entrepreneur indépendant. Expertise en scraping, automatisation et outbound marketing. 424+ projets réalisés via Malt et Fiverr, 20 scrapers publics sur Apify.',
        keywords: ['Corentin Robert', 'parcours professionnel', 'expertise scraping', 'freelance', 'growth marketing', 'automatisation']
      },
      donneesPubliques: {
        title: 'Objectifs 2026 et Progression Business - Données Publiques',
        description: 'Transparence totale sur mes objectifs 2026 et ma progression business. Key Results, métriques de croissance, évolution des projets freelance et partenariats stratégiques. Données mises à jour en temps réel.',
        keywords: ['objectifs business', 'transparence freelance', 'métriques scraping', 'progression business', 'key results', 'données publiques', 'dashboard progression']
      },
      contact: {
        title: 'Contact - Discutons de votre Projet',
        description: 'Contactez-moi pour discuter de votre projet de scraping, d\'automatisation ou d\'outbound marketing. Réponse sous 24h. Consultation gratuite.',
        keywords: ['contact', 'devis scraping', 'consultation', 'projet automatisation']
      }
    }
  }
};

