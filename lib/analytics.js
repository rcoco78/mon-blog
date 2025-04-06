import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Configuration des credentials
const credentials = {
  type: "service_account",
  project_id: "webflow-to-sheets",
  private_key_id: "c3777f55f871c0088450e3811695261a77b71ece",
  private_key: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^["']|["']$/g, ''),
  client_email: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL,
  client_id: "113377925700118327593",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/notion-blog-analytics%40webflow-to-sheets.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialisation du client
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials,
  projectId: credentials.project_id,
});

// Fonction pour obtenir le nombre de vues pour une page spécifique
async function getPageViews(pagePath) {
  try {
    // Nettoyer le chemin pour éviter les doubles slashes
    const cleanPath = pagePath.replace(/^\/+|\/+$/g, '');
    const fullPath = `/blog/${cleanPath}`.replace(/\/+/g, '/');
    
    console.log('=== Début de getPageViews ===');
    console.log('Chemin original:', pagePath);
    console.log('Chemin nettoyé:', cleanPath);
    console.log('Chemin complet:', fullPath);
    console.log('GA4_PROPERTY_ID:', process.env.GA4_PROPERTY_ID);
    console.log('Client email:', process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL);
    console.log('Private key length:', process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.length);
    
    // Essayer d'abord avec le chemin complet
    let [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '2024-01-01',
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'pagePath',
        },
      ],
      metrics: [
        {
          name: 'screenPageViews',
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'EXACT',
            value: fullPath,
          },
        },
      },
    });

    // Si aucune vue n'est trouvée, essayer avec le chemin sans /blog/
    if (!response.rows || response.rows.length === 0) {
      console.log('Aucune vue trouvée avec le chemin complet, essai avec le chemin sans /blog/');
      [response] = await analyticsDataClient.runReport({
        property: `properties/${process.env.GA4_PROPERTY_ID}`,
        dateRanges: [
          {
            startDate: '2024-01-01',
            endDate: 'today',
          },
        ],
        dimensions: [
          {
            name: 'pagePath',
          },
        ],
        metrics: [
          {
            name: 'screenPageViews',
          },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'EXACT',
              value: `/${cleanPath}`,
            },
          },
        },
      });
    }

    console.log('Réponse de Google Analytics:', JSON.stringify(response, null, 2));

    if (response.rows && response.rows.length > 0) {
      const views = parseInt(response.rows[0].metricValues[0].value);
      console.log('Nombre de vues trouvé:', views);
      return views;
    }
    console.log('Aucune vue trouvée pour ce chemin');
    return 0;
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des vues:', error);
    return 0;
  }
}

module.exports = {
  getPageViews,
}; 