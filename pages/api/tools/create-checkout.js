import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

// Fonction pour envoyer une notification Telegram
async function sendTelegramNotification(data) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.log('Variables Telegram non configurées, notification non envoyée')
    return
  }

  try {
    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    let telegramMessage = `💳 *Nouveau clic sur bouton Stripe !*\n\n`
    telegramMessage += `🌐 *Site :* corentinrobert.fr\n`
    telegramMessage += `📊 *Informations :*\n`
    telegramMessage += `• Date : ${dateStr}\n`
    telegramMessage += `• Base de données : ${data.toolName || data.toolId}\n`
    telegramMessage += `• Type : ${data.subscriptionType === 'one-time' ? 'Achat unique' : 'Abonnement annuel'}\n`
    telegramMessage += `• Prix : ${data.price}€\n`
    telegramMessage += `• Slug : ${data.toolId}\n`

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const tgPayload = {
      chat_id: chatId,
      text: telegramMessage,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    }

    const tgResp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgPayload)
    })

    const responseBody = await tgResp.text()
    let parsedBody
    try {
      parsedBody = JSON.parse(responseBody)
    } catch {
      parsedBody = responseBody
    }

    if (tgResp.ok) {
      console.log('✅ Notification Telegram envoyée avec succès:', parsedBody)
    } else {
      console.error('❌ Telegram API erreur:', {
        status: tgResp.status,
        statusText: tgResp.statusText,
        response: parsedBody,
        url: tgUrl.replace(botToken, '***'),
        chatId
      })
    }
  } catch (error) {
    console.error('❌ Erreur envoi notification Telegram:', {
      message: error.message,
      stack: error.stack
    })
  }
}

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

  // Mapping des outils avec leurs prix et options (outils statiques)
  // NOTE: Les bases de données marketplace sont maintenant gérées dynamiquement
  // Ce mapping est uniquement pour les outils non-marketplace
  const toolPrices = {
    // Les bases de données marketplace (capeb, cgp-france, etc.) sont maintenant dans marketplace-databases.json
    // et sont récupérées dynamiquement ci-dessous
  }

  // Vérifier d'abord dans les outils statiques
  let tool = toolPrices[toolId]
  
  // Si pas trouvé, chercher dans les bases de données dynamiques
  if (!tool) {
    try {
      const { getDatabaseBySlug } = await import('../../../lib/marketplace-databases')
      const database = await getDatabaseBySlug(toolId)
      
      if (database) {
        tool = {
          name: database.name, // Le nom contient déjà "Base de données -"
          price: database.price,
          description: database.shortDescription || database.description,
          image: undefined,
          features: [
            `${database.rowCount.toLocaleString()} entrées`,
            `${database.headers.length} champs par entrée`,
            'Format : Google Sheets',
            `Catégorie : ${database.category}`,
            'Mise à jour régulière'
          ]
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la base de données:', error)
    }
  }
  
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
      // Déterminer si c'est une base de données marketplace (dynamique)
      // Si l'outil n'est pas dans toolPrices, c'est une base de données dynamique
      success_url: (() => {
        const isMarketplaceTool = toolPrices[toolId] === undefined
        const basePath = isMarketplaceTool ? '/marketplace' : '/outils'
        return `${req.headers.origin}${basePath}/${toolId}?payment=success&session_id={CHECKOUT_SESSION_ID}&type=${isSubscription ? 'subscription' : 'one-time'}`
      })(),
      cancel_url: (() => {
        const isMarketplaceTool = toolPrices[toolId] === undefined
        const basePath = isMarketplaceTool ? '/marketplace' : '/outils'
        return `${req.headers.origin}${basePath}/${toolId}?payment=cancelled`
      })(),
      // Stripe collecte automatiquement l'email du client lors du checkout
      // customer_email n'est nécessaire que si on veut pré-remplir (optionnel)
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        toolId: toolId,
        subscriptionType: isSubscription ? 'annual' : 'one-time',
        toolName: tool.name,
        // email sera automatiquement disponible dans session.customer_email après le paiement
      },
      // Champ "Format préféré" uniquement pour les outils qui proposent plusieurs formats
      // Les bases de données marketplace utilisent uniquement Google Sheets
      ...(toolPrices[toolId] !== undefined ? {
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

    // Logger et envoyer notification Telegram
    console.log('💳 Clic sur bouton Stripe:', {
      toolId,
      toolName: tool.name,
      subscriptionType,
      price,
      sessionId: session.id
    })

    // Envoyer notification Telegram
    await sendTelegramNotification({
      toolId,
      toolName: tool.name,
      subscriptionType,
      price
    })

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Erreur Stripe:', error)
    return res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' })
  }
}

