// Liste des outils disponibles
export const tools = [
  {
    name: 'Générateur de Templates d\'Emails',
    description: 'Créez des templates d\'outreach performants avec notre outil gratuit. Personnalisez vos messages et augmentez vos taux de réponse.',
    category: 'Outreach',
    iconSvg: 'email',
    link: '/outils/email-generator',
    isNew: true,
    date: '2024-01-15' // Date de création pour trier les plus récents
  },
  {
    name: 'Extracteur LinkedIn',
    description: 'Extrayez des données de profils LinkedIn de manière éthique et efficace. Version gratuite limitée à 50 profils par jour.',
    category: 'Scraping',
    iconSvg: 'search',
    link: '/outils/linkedin-extractor',
    isNew: true,
    date: '2024-01-10'
  },
  {
    name: 'Générateur de Descriptions Immobilières',
    description: 'Créez des descriptions immobilières optimisées pour le luxe. Templates et suggestions de mots-clés inclus.',
    category: 'Immobilier',
    iconSvg: 'house',
    link: '/outils/real-estate-generator',
    isNew: false,
    date: '2023-12-01'
  },
  {
    name: 'Dashboard Notion pour Agents',
    description: 'Template Notion complet pour la gestion de votre activité immobilière. Suivi des clients, visites et contenus.',
    category: 'Productivité',
    iconSvg: 'grid',
    link: '/outils/notion-dashboard',
    isNew: false,
    date: '2023-11-15'
  }
]

// Fonction pour obtenir les outils les plus récents
export function getRecentTools(count = 3) {
  return tools
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, count)
}

