/**
 * API Route pour récupérer les actors Apify d'un utilisateur
 * Utilise le MCP Apify si disponible, sinon fallback vers l'API Apify
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username = 'corent1robert' } = req.query

  try {
    // Pour l'instant, retourner une liste statique basée sur les actors trouvés
    // Dans le futur, on pourra utiliser le MCP Apify directement ici
    const actors = [
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
        id: 'corent1robert/airbnb-property-scraper',
        username: 'corent1robert',
        name: 'airbnb-property-scraper',
        title: 'Airbnb Property Scraper',
        description: 'High-performance Airbnb property data scraper with optimized pagination and memory management.',
        stats: { runs: 0, users: 14, successRate: 95.5 },
        url: 'https://apify.com/corent1robert/airbnb-property-scraper',
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

    return res.status(200).json({
      success: true,
      actors: actors
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des actors:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
