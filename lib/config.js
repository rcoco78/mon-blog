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
      title: 'Freelance en scraping et automatisation',
      description: 'Services de scraping et automatisation pour entreprises — outils sur-mesure et livraison de données',
      link: 'https://www.malt.fr/profile/growth',
      status: 'active',
      image: '/images/pp.png',
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
        description: 'Expert freelance scraping et automatisation à Paris. 424+ projets réalisés via Malt et Fiverr, livraison en 7 jours. Spécialisé scraping immobilier et santé. Consultant scraping TPE-PME, automatisation processus business.',
        keywords: ['scraping freelance', 'automatisation', 'consultant scraping', 'web scraping', 'data automation', 'freelance scraping France', 'freelance scraping Paris', 'consultant scraping TPE-PME', 'scraping immobilier', 'automatisation processus business']
      },
      blog: {
        title: 'Blog - Corentin Robert',
        description: 'Blog personnel de Corentin Robert. Articles, réflexions et partages sur l\'entrepreneuriat, le scraping, l\'automatisation, le voyage et bien plus. Freelance scraping France.',
        keywords: ['blog', 'articles entrepreneuriat', 'scraping freelance', 'automatisation', 'growth hacking', 'voyage', 'freelance scraping France']
      },
      outils: {
        title: 'Marketplace - Outils et Bases de Données Scraping',
        description: 'Marketplace d\'outils scraping, automatisation et bases de données par Corentin Robert. Générateurs de templates, extracteurs de données, outils de productivité, bases de données. Outils gratuits et payants pour automatiser vos processus business.',
        keywords: ['marketplace scraping', 'outils scraping gratuits', 'outils automatisation', 'bases de données scraping', 'générateur templates email', 'extracteur linkedin', 'outils gratuits scraping web', 'automatiser processus business']
      },
      aPropos: {
        title: 'À Propos - Parcours et Expertise de Corentin Robert',
        description: 'Parcours de growth marketeux chez Airbnb à entrepreneur indépendant. Expert scraping et automatisation à Paris. 424+ projets réalisés, 5/5 sur Malt. Spécialisé scraping immobilier et santé pour TPE-PME.',
        keywords: ['Corentin Robert', 'parcours professionnel', 'expertise scraping', 'freelance', 'growth marketing', 'automatisation', 'freelance scraping Paris', 'consultant scraping TPE-PME']
      },
      donneesPubliques: {
        title: 'Objectifs 2026 - Freelance Scraping et Automatisation | Corentin Robert',
        description: 'Expert freelance scraping et automatisation. Objectifs 2026, métriques business et progression en temps réel. 424+ projets réalisés, 5/5 sur Malt, 7 jours de délai moyen. Livraison en moins d\'une semaine. Contactez-moi.',
        keywords: ['freelance scraping', 'expert automatisation', 'freelance scraping France', 'consultant scraping', 'objectifs business freelance', 'transparence freelance', 'métriques scraping', 'progression business', 'key results', 'données publiques', 'dashboard progression', 'scraping immobilier', 'scraping santé']
      },
      contact: {
        title: 'Contact - Discutons de votre Projet | Corentin Robert',
        description: 'Contactez-moi pour discuter de votre projet de scraping, d\'automatisation ou d\'outbound marketing. Consultation gratuite de 20 minutes. Réponse sous 24h. Expert scraping Paris, spécialisé immobilier et santé.',
        keywords: ['contact', 'devis scraping', 'consultation', 'projet automatisation', 'contact freelance scraping', 'devis scraping Paris', 'consultation automatisation']
      }
    }
  }
};

