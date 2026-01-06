// Liste des outils et bases de données disponibles
// NOTE: Les bases de données marketplace sont maintenant gérées dynamiquement via marketplace-databases.json
// Cette liste contient uniquement les outils statiques (non-dynamiques)
// Les bases de données dynamiques sont chargées via getDatabasesAsTools() dans marketplace.js
// et fusionnées avec cette liste dans la page marketplace
export const tools = [
  // Les bases de données sont maintenant toutes gérées dynamiquement
  // Ajoutez ici uniquement les outils statiques qui ne sont pas des bases de données marketplace
]

// Fonction pour obtenir les outils les plus récents (triés par date, du plus récent au plus ancien)
// Inclut maintenant les bases de données dynamiques si disponibles
export function getRecentTools(count = 3) {
  // Récupérer les bases de données dynamiques si disponibles (côté serveur uniquement)
  let allTools = [...tools]
  
  try {
    if (typeof window === 'undefined') {
      const { getDatabasesAsTools } = require('./marketplace-databases')
      const dynamicDatabases = getDatabasesAsTools()
      allTools = [...dynamicDatabases, ...tools]
    }
  } catch (error) {
    // Si erreur (ex: module non disponible), continuer avec tools uniquement
    console.warn('Impossible de charger les bases de données dynamiques:', error)
  }
  
  return allTools
    .sort((a, b) => {
      // Trier par date : du plus récent au plus ancien
      const dateA = a.date ? new Date(a.date) : new Date(0) // Si pas de date, mettre en fin
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA // Ordre décroissant (plus récent en premier)
    })
    .slice(0, count)
}
