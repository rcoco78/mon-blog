/**
 * Fonction pour récupérer les Actors Apify publiés d'un utilisateur
 * Utilise les données enrichies depuis Blob Storage (synchronisées via cron job)
 */

const APIFY_API_BASE = 'https://api.apify.com/v2'

/**
 * Récupère tous les actors publics d'un utilisateur Apify
 * Charge depuis les actors enrichis (Blob Storage) avec fallback vers la source originale
 * @param {string} username - Le nom d'utilisateur Apify (ex: 'corent1robert')
 * @returns {Promise<Array>} Liste des actors avec leurs métadonnées
 */
export async function getApifyActors(username = 'corent1robert') {
  // Essayer d'abord de charger depuis les actors enrichis
  try {
    const { getAllEnrichedActors } = await import('./apify-actors-enriched')
    const enrichedActors = await getAllEnrichedActors()
    
    if (enrichedActors && enrichedActors.length > 0) {
      // Filtrer par username si nécessaire
      const filtered = enrichedActors.filter(actor => 
        !username || (actor.username || '').toLowerCase() === username.toLowerCase()
      )
      
      if (filtered.length > 0) {
        return filtered.map(actor => ({
          id: actor.id,
          username: actor.username,
          name: actor.name,
          title: actor.title || actor.name,
          description: actor.description || '',
          stats: actor.stats || { runs: 0, users: 0, successRate: 0 },
          defaultRunInput: actor.defaultRunInput || {},
          inputSchema: actor.inputSchema || {},
          createdAt: actor.createdAt,
          modifiedAt: actor.modifiedAt,
          slug: actor.slug || actor.name,
          url: actor.url,
          isPublic: actor.isPublic
        }))
      }
    }
  } catch (error) {
    console.warn('⚠️ Erreur chargement actors enrichis, fallback:', error.message)
  }

  // Fallback vers la source originale
  return await getApifyActorsFromSource(username)
}

/**
 * Fonction pour récupérer les actors depuis Apify (utilisée par le script d'enrichissement)
 * @param {string} username - Le nom d'utilisateur Apify (ex: 'corent1robert')
 * @returns {Promise<Array>} Liste des actors avec leurs métadonnées
 */
export async function getApifyActorsFromSource(username = 'corent1robert') {
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

  try {
    // Côté serveur : utiliser directement les données statiques pour l'instant
    // Dans le futur, on pourra appeler le MCP Apify directement ici
    if (typeof window === 'undefined') {
      // Pour l'instant, utiliser les données de l'API route
      // On pourrait aussi importer directement les données ici
      try {
        // Utiliser les données statiques basées sur le MCP
        const staticActors = [
          {
            id: 'corent1robert/airbnb-professional-host-scraper',
            username: 'corent1robert',
            name: 'airbnb-professional-host-scraper',
            title: 'Airbnb Pro Host Business Email Scraper',
            description: '🚀 High-performance Airbnb scraper for B2B lead generation. Extracts professional host business information including company names, email addresses, phone numbers, and registration details.',
            stats: { runs: 0, users: 63, successRate: 83.1 },
            url: 'https://apify.com/corent1robert/airbnb-professional-host-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/airbnb-property-details-scraper',
            username: 'corent1robert',
            name: 'airbnb-property-details-scraper',
            title: 'Airbnb Property Scraper',
            description: 'High-performance Airbnb property data scraper with optimized pagination and memory management.',
            stats: { runs: 0, users: 14, successRate: 95.5 },
            url: 'https://apify.com/corent1robert/airbnb-property-details-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/airbnb-reviews-scraper',
            username: 'corent1robert',
            name: 'airbnb-reviews-scraper',
            title: 'Airbnb Reviews Scraper',
            description: 'Automatically collects Airbnb reviews from any listing URL. Retrieves the reviewer\'s name, rating, date, and comment.',
            stats: { runs: 0, users: 13, successRate: 92.6 },
            url: 'https://apify.com/corent1robert/airbnb-reviews-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/era-immobilier-scraper',
            username: 'corent1robert',
            name: 'era-immobilier-scraper',
            title: 'Era Immobilier Scraper',
            description: 'Extract comprehensive data from ERA Immobilier agencies including agency information and agent details.',
            stats: { runs: 0, users: 2, successRate: 92.9 },
            url: 'https://apify.com/corent1robert/era-immobilier-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/cote-particuliers-scraper',
            username: 'corent1robert',
            name: 'cote-particuliers-scraper',
            title: 'Cote Particuliers Scraper',
            description: 'Extract comprehensive data from Côté Particuliers agencies including agency information and collaborator details.',
            stats: { runs: 0, users: 2, successRate: 100.0 },
            url: 'https://apify.com/corent1robert/cote-particuliers-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/keymex-scraper',
            username: 'corent1robert',
            name: 'keymex-scraper',
            title: 'Keymex Scraper',
            description: 'Extract comprehensive data from Keymex centers including center information and collaborator details.',
            stats: { runs: 0, users: 2, successRate: 100.0 },
            url: 'https://apify.com/corent1robert/keymex-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/lgm-immobilier-scraper',
            username: 'corent1robert',
            name: 'lgm-immobilier-scraper',
            title: 'Lgm Immobilier Scraper',
            description: 'Extract comprehensive data from LGM Immobilier advisors including contact details, location data, and professional information.',
            stats: { runs: 0, users: 2, successRate: 100.0 },
            url: 'https://apify.com/corent1robert/lgm-immobilier-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/actulegales-scraper',
            username: 'corent1robert',
            name: 'actulegales-scraper',
            title: 'Actulegales Scraper',
            description: 'Extract comprehensive legal announcements from Actulegales.fr.',
            stats: { runs: 0, users: 2, successRate: 91.7 },
            url: 'https://apify.com/corent1robert/actulegales-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/reseau-expertimo-scraper',
            username: 'corent1robert',
            name: 'reseau-expertimo-scraper',
            title: 'Reseau Expertimo Scraper',
            description: 'Extract comprehensive data from Reseau Expertimo agencies and mandataires including contact details, location data, and professional information.',
            stats: { runs: 0, users: 2, successRate: 100.0 },
            url: 'https://apify.com/corent1robert/reseau-expertimo-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/ikami-scraper',
            username: 'corent1robert',
            name: 'ikami-scraper',
            title: 'Ikami Scraper',
            description: 'Extract comprehensive data from Ikami advisors including advisor information, contact details, location data, and number of active listings.',
            stats: { runs: 0, users: 2, successRate: 100.0 },
            url: 'https://apify.com/corent1robert/ikami-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/investorlift-scraper',
            username: 'corent1robert',
            name: 'investorlift-scraper',
            title: 'Investorlift Scraper',
            description: 'Extract comprehensive data from InvestorLift marketplace properties including property details, pricing, location data, and account information.',
            stats: { runs: 0, users: 2, successRate: 0.0 },
            url: 'https://apify.com/corent1robert/investorlift-scraper',
            isPublic: true
          },
          {
            id: 'corent1robert/startupticker-scraper',
            username: 'corent1robert',
            name: 'startupticker-scraper',
            title: 'Startupticker.ch Investors Scraper',
            description: 'Extract comprehensive investor data from startupticker.ch, Switzerland\'s leading startup ecosystem directory.',
            stats: { runs: 0, users: 2, successRate: 0.0 },
            url: 'https://apify.com/corent1robert/startupticker-scraper',
            isPublic: true
          }
        ]

        return staticActors.map(actor => ({
          id: actor.id,
          username: actor.username,
          name: actor.name,
          title: actor.title || actor.name,
          description: actor.description || '',
          stats: {
            runs: actor.stats?.runs || 0,
            users: actor.stats?.users || 0,
            successRate: actor.stats?.successRate || 0
          },
          defaultRunInput: {},
          inputSchema: {},
          createdAt: null,
          modifiedAt: null,
          slug: actor.name,
          url: actor.url,
          isPublic: actor.isPublic
        }))
      } catch (error) {
        console.warn('⚠️ Erreur lors du chargement des actors statiques:', error.message)
      }
    }

    // Essayer avec l'API Apify directe si un token est disponible
    if (APIFY_API_TOKEN) {
      const response = await fetch(`${APIFY_API_BASE}/users/${username}/actors`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Filtrer uniquement les actors publics et non dépréciés
        const userActors = (data.data?.items || []).filter(actor => {
          return actor.isPublic === true && actor.isDeprecated === false
        })

        return userActors.map(actor => ({
          id: actor.id,
          username: actor.username,
          name: actor.name,
          title: actor.title || actor.name,
          description: actor.description || '',
          stats: {
            runs: actor.stats?.runs || 0,
            users: actor.stats?.users || 0,
            successRate: actor.stats?.successRate || 0
          },
          defaultRunInput: actor.defaultRunInput || {},
          inputSchema: actor.inputSchema || {},
          createdAt: actor.createdAt,
          modifiedAt: actor.modifiedAt,
          slug: actor.name,
          url: `https://apify.com/${actor.username}/${actor.name}`,
          isPublic: actor.isPublic
        }))
      }
    }

    // Fallback: essayer de récupérer depuis la page publique (scraping)
    console.warn('⚠️ API Apify non disponible, utilisation du fallback')
    return await getApifyActorsFromScraping(username)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des actors Apify:', error)
    // Fallback vers scraping si l'API échoue
    return await getApifyActorsFromScraping(username)
  }
}

/**
 * Récupère les actors en scrapant la page publique du profil Apify
 * Fallback si l'API n'est pas accessible
 * 
 * Note: Pour une solution plus robuste, on pourrait utiliser un actor Apify
 * dédié au scraping de profils, ou utiliser l'API publique d'Apify Store
 */
async function getApifyActorsFromScraping(username = 'corent1robert') {
  try {
    // Pour l'instant, retourner un tableau vide
    // L'utilisateur devra configurer APIFY_API_TOKEN dans les variables d'environnement
    // ou implémenter un scraping plus robuste
    console.warn('⚠️ Scraping de la page Apify non implémenté. Configurez APIFY_API_TOKEN pour utiliser l\'API Apify.')
    return []
  } catch (error) {
    console.error('❌ Erreur lors du scraping de la page Apify:', error)
    return []
  }
}

/**
 * Convertit un actor Apify en format tool pour la marketplace
 */
export function apifyActorToTool(actor) {
  return {
    slug: actor.slug || actor.name || '',
    name: actor.title || actor.name || '',
    description: actor.description || '',
    category: actor.enrichedData?.category || 'Scraping & Automatisation',
    type: 'tool',
    iconSvg: 'search',
    link: (() => {
      const s = (actor.slug || actor.name || '').trim()
      if (!s || /[\[\]{}]/.test(s) || ['[slug]', '[category]', '[id]'].includes(s)) return null
      return `/marketplace/outils/${s}`
    })(),
    isPaid: false,
    price: 0,
    isNew: false,
    date: actor.createdAt ? new Date(actor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    // Métadonnées spécifiques Apify (utiliser null au lieu de undefined)
    apifyActorId: actor.id || null,
    apifyUsername: actor.username || null,
    apifyUrl: actor.url || null,
    apifyStats: actor.stats || null,
    apifyInputSchema: actor.inputSchema || null,
    apifyDefaultRunInput: actor.defaultRunInput || null,
    // Données enrichies - IMPORTANT : préserver enrichedData
    enrichedData: actor.enrichedData || null
  }
}

/**
 * Récupère les actors Apify et les convertit en format tools
 */
export async function getApifyActorsAsTools(username = 'corent1robert') {
  const actors = await getApifyActors(username)
  return actors.map(apifyActorToTool)
}
