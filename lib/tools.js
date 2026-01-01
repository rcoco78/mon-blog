// Liste des outils et bases de données disponibles
export const tools = [
  {
    name: 'Générateur de Templates d\'Emails',
    description: 'Créez des templates d\'outreach performants avec notre outil gratuit. Personnalisez vos messages et augmentez vos taux de réponse.',
    category: 'Outreach',
    type: 'outil', // 'outil' ou 'database'
    iconSvg: 'email',
    link: '/outils/email-generator',
    isPaid: false,
    price: 0,
    isNew: true,
    date: '2024-01-15'
  },
  {
    name: 'Extracteur LinkedIn',
    description: 'Extrayez des données de profils LinkedIn de manière éthique et efficace. Version gratuite limitée à 50 profils par jour.',
    category: 'Scraping',
    type: 'outil',
    iconSvg: 'search',
    link: '/outils/linkedin-extractor',
    isPaid: false,
    price: 0,
    isNew: true,
    date: '2024-01-10'
  },
  {
    name: 'Générateur de Descriptions Immobilières',
    description: 'Créez des descriptions immobilières optimisées pour le luxe. Templates et suggestions de mots-clés inclus.',
    category: 'Immobilier',
    type: 'outil',
    iconSvg: 'house',
    link: '/outils/real-estate-generator',
    isPaid: false,
    price: 0,
    isNew: false,
    date: '2023-12-01'
  },
  {
    name: 'Dashboard Notion pour Agents',
    description: 'Template Notion complet pour la gestion de votre activité immobilière. Suivi des clients, visites et contenus.',
    category: 'Productivité',
    type: 'outil',
    iconSvg: 'grid',
    link: '/outils/notion-dashboard',
    isPaid: false,
    price: 0,
    isNew: false,
    date: '2023-11-15'
  },
  {
    name: 'Base de données - Dentistes Parisiens',
    description: 'Base de données complète des dentistes à Paris avec coordonnées, spécialités et informations de contact. Idéal pour la prospection et l\'analyse du marché dentaire parisien.',
    category: 'Scraping',
    type: 'database',
    iconSvg: 'search',
    link: '/outils/dentistes-parisiens',
    isPaid: true,
    price: 49,
    isNew: true,
    date: '2024-01-20'
  }
]

// Fonction pour obtenir les outils les plus récents
export function getRecentTools(count = 3) {
  return tools
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, count)
}

