// Liste des outils et bases de données disponibles
export const tools = [
  {
    name: 'Base de données - CGP France',
    description: 'Base de données complète des cabinets CGP France (le plus grand réseau de conseillers en gestion de patrimoine indépendants en France) avec coordonnées, informations professionnelles, profils managers et données business. Idéal pour la prospection et l\'analyse du marché de la gestion de patrimoine.',
    category: 'Finance',
    type: 'database',
    iconSvg: 'search',
    link: '/marketplace/cgp-france',
    isPaid: true,
    price: 99, // Prix achat unique TTC
    isNew: true,
    date: '2026-01-04'
  },
  {
    name: 'Base de données - Artisans CAPEB',
    description: 'Base de données complète des artisans de France (CAPEB) avec coordonnées, typologie de profession et informations de contact. Idéal pour la prospection et l\'analyse du marché de l\'artisanat français.',
    category: 'Artisanat',
    type: 'database',
    iconSvg: 'search',
    link: '/marketplace/capeb',
    isPaid: true,
    price: 99, // Prix achat unique TTC
    isNew: true,
    date: '2026-01-03'
  }
]

// Fonction pour obtenir les outils les plus récents (triés par date, du plus récent au plus ancien)
export function getRecentTools(count = 3) {
  return tools
    .sort((a, b) => {
      // Trier par date : du plus récent au plus ancien
      const dateA = a.date ? new Date(a.date) : new Date(0) // Si pas de date, mettre en fin
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA // Ordre décroissant (plus récent en premier)
    })
    .slice(0, count)
}

