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
      description: '400+ projets réalisés via Malt & Fiverr',
      link: 'https://www.malt.fr/profile/growth',
      status: 'active',
      image: '/images/profile.jpg',
      imageAlt: 'Corentin Robert - Consultant freelance en scraping et automatisation'
    },
    {
      id: 'logement-atypique',
      title: 'Logement Atypique',
      description: '+2000 logements atypiques référencés — tiny, villas, châteaux...',
      link: 'https://logement-atypique.fr/?utm_source=corentinrobert&utm_medium=website&utm_campaign=homepage',
      status: 'active',
      icon: '/images/logement-atypique-icon.svg',
      iconAlt: 'Logo Logement Atypique - Plateforme de logements exceptionnels'
    },
    {
      id: 'outreacher',
      title: 'Outreacher',
      description: 'Agence qui crée une sales machine outbound automatisé',
      link: 'mailto:corentin@outreacher.fr',
      status: 'active',
      icon: '/images/logo-outreacher.jpeg',
      iconAlt: 'Logo Outreacher - Agence d\'outbound marketing et prospection automatisée'
    },
    {
      id: 'contributeurs-apify',
      title: 'Contributeurs Apify',
      description: 'Je construis les scrapers adaptés pour mes clients via Apify',
      link: 'https://apify.com?fpr=0n7ukq',
      status: 'active',
      icon: '/images/apify-icon.svg',
      iconAlt: 'Logo Apify - Plateforme de web scraping et automatisation'
    },
    {
      id: 'lemlist',
      title: 'Partenaire Lemlist',
      description: 'Je déploie la solution et accompagne mes clients sur Lemlist',
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
        description: 'Consultant freelance spécialisé en scraping et automatisation. 167 projets réalisés sur Malt, 20 scrapers publics sur Apify. Expertise en outbound marketing automatisé et data automation pour entreprises.',
        keywords: ['scraping freelance', 'automatisation', 'consultant scraping', 'web scraping', 'data automation']
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
        description: 'Découvrez mon parcours de développeur chez Airbnb à entrepreneur indépendant. Expertise en scraping, automatisation et growth hacking. 167 projets réalisés, 20 scrapers publics.',
        keywords: ['Corentin Robert', 'parcours professionnel', 'expertise scraping', 'freelance']
      },
      open: {
        title: 'Projets Open Source - Scrapers et Outils Publics',
        description: 'Découvrez mes projets open source et scrapers publics sur Apify. Outils de scraping, automatisation et data extraction disponibles gratuitement.',
        keywords: ['open source', 'projets publics', 'scrapers Apify', 'outils gratuits']
      },
      contact: {
        title: 'Contact - Discutons de votre Projet',
        description: 'Contactez-moi pour discuter de votre projet de scraping, d\'automatisation ou d\'outbound marketing. Réponse sous 24h. Consultation gratuite.',
        keywords: ['contact', 'devis scraping', 'consultation', 'projet automatisation']
      }
    }
  }
};

