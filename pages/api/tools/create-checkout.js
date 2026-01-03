import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { toolId, subscriptionType } = req.body // subscriptionType: 'one-time' ou 'annual'
  // Note: email n'est plus nécessaire, Stripe le collecte automatiquement lors du checkout

  if (!toolId) {
    return res.status(400).json({ error: 'Tool ID is required' })
  }

  // Déterminer le type de paiement
  const isSubscription = subscriptionType === 'annual'

  // Mapping des outils avec leurs prix et options
  const toolPrices = {
    'dentistes-parisiens': {
      name: 'Base de données - Dentistes Parisiens',
      price: 79, // Prix en euros (paiement unique)
      annualPrice: 59, // Prix annuel (abonnement avec mises à jour)
      description: 'Base de données complète des dentistes à Paris (500+ entrées)',
      image: 'https://www.corentinrobert.fr/images/outils/dentistes-parisiens-thumb.jpg', // Image du produit
      features: [
        '500+ dentistes parisiens',
        '8 champs par entrée',
        'Formats : CSV, Excel, JSON',
        'Mise à jour régulière'
      ],
      annualFeatures: [
        '500+ dentistes parisiens',
        '8 champs par entrée',
        'Formats : CSV, Excel, JSON',
        'Mise à jour annuelle du fichier incluse',
        'Renouvellement automatique chaque année'
      ]
    },
    'capeb': {
      name: 'Base de données - Artisans CAPEB',
      price: 99, // Prix en euros (paiement unique)
      description: 'Base de données complète des artisans de France (CAPEB)',
      image: undefined, // Image du produit (à ajouter si disponible)
      features: [
        'Tous les artisans CAPEB de France',
        '22 champs par entrée',
        'Formats : CSV, Excel, JSON',
        'Données complètes : SIRET, géolocalisation, labels RGE, activités, etc.',
        'Mise à jour régulière'
      ]
    }
  }

  const tool = toolPrices[toolId]
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' })
  }

  try {
    // Construire la description avec les features selon le type
    const features = isSubscription ? (tool.annualFeatures || tool.features) : tool.features
    const description = tool.description + (features ? '\n\n' + features.map(f => `✓ ${f}`).join('\n') : '')
    
    // Nom du produit selon le type
    const productName = isSubscription 
      ? `${tool.name} - Abonnement Annuel (mises à jour incluses)`
      : `${tool.name} - Achat unique`
    
    // Prix selon le type
    const price = isSubscription ? (tool.annualPrice || tool.price) : tool.price
    
    // Créer une session Stripe Checkout avec options
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description: description,
              images: tool.image ? [tool.image] : undefined,
            },
            ...(isSubscription ? {
              // Pour l'abonnement : prix récurrent annuel
              recurring: {
                interval: 'year',
                interval_count: 1,
              },
            } : {}),
            unit_amount: price * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${req.headers.origin}${toolId.startsWith('capeb') || toolId.startsWith('dentistes-parisiens') ? '/databases' : '/outils'}/${toolId}?payment=success&session_id={CHECKOUT_SESSION_ID}&type=${isSubscription ? 'subscription' : 'one-time'}`,
      cancel_url: `${req.headers.origin}${toolId.startsWith('capeb') || toolId.startsWith('dentistes-parisiens') ? '/databases' : '/outils'}/${toolId}?payment=cancelled`,
      // Stripe collecte automatiquement l'email du client lors du checkout
      // customer_email n'est nécessaire que si on veut pré-remplir (optionnel)
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        toolId: toolId,
        subscriptionType: isSubscription ? 'annual' : 'one-time',
        // email sera automatiquement disponible dans session.customer_email après le paiement
      },
      // Champ "Format préféré" uniquement pour les outils qui proposent plusieurs formats
      // CAPEB utilise uniquement Google Sheets, donc pas besoin de ce champ
      ...(toolId !== 'capeb' ? {
        custom_fields: [
          {
            key: 'format_preference',
            label: {
              type: 'custom',
              custom: 'Format préféré (optionnel)',
            },
            type: 'dropdown',
            dropdown: {
              options: [
                { label: 'Tous les formats (CSV, Excel, JSON)', value: 'all' },
                { label: 'CSV uniquement', value: 'csv' },
                { label: 'Excel uniquement', value: 'excel' },
                { label: 'JSON uniquement', value: 'json' },
              ],
            },
          },
        ],
      } : {}),
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig)

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Erreur Stripe:', error)
    return res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' })
  }
}

