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

  const { toolId, subscriptionType, addonIds = [] } = req.body // subscriptionType: 'one-time' ou 'annual'
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
  
  let database = null
  if (!tool) {
    try {
      const { getDatabaseBySlug } = await import('../../../lib/marketplace-databases')
      database = await getDatabaseBySlug(toolId)
      
      if (database) {
        tool = {
          name: database.name,
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

  // Si toujours pas trouvé, chercher dans les outils Apify
  if (!tool) {
    try {
      const { getAllEnrichedActors } = await import('../../../lib/apify-actors-enriched')
      const { apifyActorToTool } = await import('../../../lib/apify-actors')
      const actors = await getAllEnrichedActors()
      const actor = actors.find(a => (a.slug || a.name) === toolId)
      
      if (actor) {
        const toolFormatted = apifyActorToTool(actor)
        tool = {
          name: toolFormatted.name,
          price: 5, // Prix fixe de 5€ pour l'accès aux résultats complets
          description: toolFormatted.description,
          image: undefined,
          features: [
            'Accès à tous les résultats',
            'Export des données',
            'Support prioritaire'
          ]
        }
      }
    } catch (error) {
      console.error('Erreur chargement outil Apify:', error)
    }
  }
  
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' })
  }

  // Récupérer les add-ons (bases de données marketplace uniquement) - pour flux pré-sélection UI
  const addonTools = []
  if (Array.isArray(addonIds) && addonIds.length > 0) {
    try {
      const { getDatabaseBySlug } = await import('../../../lib/marketplace-databases')
      for (const addonId of addonIds) {
        if (addonId === toolId) continue
        const db = await getDatabaseBySlug(addonId)
        if (db && db.isPaid) {
          addonTools.push({ slug: db.slug, name: db.name, price: db.price, description: db.shortDescription || db.description })
        }
      }
    } catch (err) {
      console.error('Erreur chargement add-ons:', err)
    }
  }

  // Flux optional_items Stripe : produit principal + add-ons en options natives (choix dans Stripe)
  // addonSlugs explicites OU bases de la même catégorie (Immobilier, etc.)
  let addonSlugs = (database?.addonSlugs || []).filter((s) => s !== toolId)
  if (database && addonSlugs.length === 0) {
    const { getRelatedDatabases } = await import('../../../lib/marketplace-databases')
    const related = await getRelatedDatabases(toolId, 10)
    addonSlugs = related.filter((r) => r.slug !== toolId && r.isPaid).map((r) => r.slug)
  }
  const useOptionalItems = database && !isSubscription && addonTools.length === 0 && addonSlugs.length > 0
  let priceIds = null
  let optionalItems = []
  if (useOptionalItems) {
    try {
      const { getStripePriceIds } = await import('../../../lib/stripe-price-ids')
      priceIds = await getStripePriceIds()
      const mainPriceId = priceIds[toolId]?.priceId
      if (mainPriceId) {
        optionalItems = addonSlugs
          .filter((slug) => priceIds[slug]?.priceId)
          .slice(0, 10)
          .map((slug) => ({ price: priceIds[slug].priceId, quantity: 1 }))
      }
    } catch (e) {
      console.warn('optional_items non utilisable:', e.message)
    }
  }
  const useStripeOptionalItems = useOptionalItems && priceIds?.[toolId]?.priceId

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

    // Construire line_items et optional_items
    let lineItems
    let allToolIds = [toolId]

    if (useStripeOptionalItems) {
      // Flux optional_items : Price IDs, add-ons proposés dans Stripe
      lineItems = [{ price: priceIds[toolId].priceId, quantity: 1 }]
      allToolIds = [toolId]
      // toolIds sera déduit des line_items par le webhook (client choisit dans Stripe)
    } else {
      // Flux price_data : principal + add-ons pré-sélectionnés (avec remise bundle)
      const bundleCount = 1 + addonTools.length
      const bundleDiscount = bundleCount >= 3 ? 0.15 : bundleCount >= 2 ? 0.1 : 0
      const multiplier = 1 - bundleDiscount

      const mainAmount = Math.round(price * 100 * multiplier)
      lineItems = [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: !isSubscription && bundleDiscount > 0 ? `${productName} (bundle -${Math.round(bundleDiscount * 100)}%)` : productName,
              description: description,
              images: tool.image ? [tool.image] : undefined,
            },
            ...(isSubscription ? { recurring: { interval: 'year', interval_count: 1 } } : {}),
            unit_amount: isSubscription ? price * 100 : mainAmount,
            tax_behavior: 'inclusive',
          },
          quantity: 1,
        },
      ]
      if (!isSubscription && addonTools.length > 0) {
        for (const addon of addonTools) {
          const addonAmount = Math.round(addon.price * 100 * multiplier)
          lineItems.push({
            price_data: {
              currency: 'eur',
              product_data: {
                name: `${addon.name} - Achat unique (bundle -${Math.round(bundleDiscount * 100)}%)`,
                description: addon.description || '',
              },
              unit_amount: addonAmount,
              tax_behavior: 'inclusive',
            },
            quantity: 1,
          })
        }
        allToolIds = [toolId, ...addonTools.map((a) => a.slug)]
      }
    }

    // Créer une session Stripe Checkout avec options
    // Prix TTC (tax_behavior: inclusive) : en France le prix affiché est toujours TTC pour le B2C
    // Stripe Tax calcule automatiquement la TVA selon l'adresse du client
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      ...(useStripeOptionalItems && optionalItems.length > 0 && { optional_items: optionalItems }),
      mode: isSubscription ? 'subscription' : 'payment',
      // TVA automatique : Stripe Tax calcule selon l'adresse du client (France = 20% TVA)
      // Activer Stripe Tax dans le Dashboard : Paramètres > Tax > Enable Stripe Tax
      automatic_tax: { enabled: true },
      // Collecte du numéro de TVA et nom d'entreprise pour les achats professionnels (B2B)
      tax_id_collection: { enabled: true },
      // Adresse requise pour le calcul de la TVA et la facturation
      billing_address_collection: 'required',
      // Checkout en français
      locale: 'fr',
      // Créer un Customer pour sauvegarder les infos (adresse, TVA, nom entreprise)
      customer_creation: 'always',
      // URLs de retour : outil Apify (marketplace/outils) vs base de données (marketplace ou /outils)
      success_url: (() => {
        const isApifyTool = !toolPrices[toolId] && (toolId.includes('-scraper') || toolId.includes('airbnb') || toolId.includes('immobilier'))
        if (isApifyTool) {
          return `${req.headers.origin}/marketplace/outils/${toolId}?payment=success&session_id={CHECKOUT_SESSION_ID}&type=${isSubscription ? 'subscription' : 'one-time'}`
        }
        const isMarketplaceTool = toolPrices[toolId] === undefined
        const basePath = isMarketplaceTool ? '/marketplace' : '/outils'
        return `${req.headers.origin}${basePath}/${toolId}?payment=success&session_id={CHECKOUT_SESSION_ID}&type=${isSubscription ? 'subscription' : 'one-time'}`
      })(),
      cancel_url: (() => {
        const isApifyTool = !toolPrices[toolId] && (toolId.includes('-scraper') || toolId.includes('airbnb') || toolId.includes('immobilier'))
        if (isApifyTool) {
          return `${req.headers.origin}/marketplace/outils/${toolId}?payment=cancel`
        }
        const isMarketplaceTool = toolPrices[toolId] === undefined
        const basePath = isMarketplaceTool ? '/marketplace' : '/outils'
        return `${req.headers.origin}${basePath}/${toolId}?payment=cancelled`
      })(),
      // Stripe collecte automatiquement l'email du client lors du checkout
      // customer_email n'est nécessaire que si on veut pré-remplir (optionnel)
      // Codes promo : bundles uniquement — soit add-ons pré-sélectionnés (checkboxes), soit optional_items (bundle formé sur Stripe)
      ...(database && (addonTools.length > 0 || useStripeOptionalItems) ? { allow_promotion_codes: true } : {}),
      metadata: {
        toolId: toolId,
        toolIds: useStripeOptionalItems ? toolId : allToolIds.join(','),
        subscriptionType: isSubscription ? 'annual' : 'one-time',
        toolName: tool.name,
      },
      // Champs personnalisés : format (outils statiques) + infos pro (tous les achats)
      custom_fields: [
        // Nom d'entreprise optionnel — pour facturation (en complément de tax_id_collection)
        {
          key: 'company_name',
          label: { type: 'custom', custom: 'Nom de l\'entreprise (optionnel)' },
          type: 'text',
          optional: true,
        },
        // Format préféré uniquement pour les outils statiques multi-formats
        ...(toolPrices[toolId] !== undefined ? [
          {
            key: 'format_preference',
            label: { type: 'custom', custom: 'Format préféré (optionnel)' },
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
        ] : []),
      ],
    }

    const allowPromo = !!(database && (addonTools.length > 0 || useStripeOptionalItems))
    console.log('📋 create-checkout session:', { toolId, isMarketplace: !!database, isBundleFlow: addonTools.length > 0 || useStripeOptionalItems, allow_promotion_codes: allowPromo })
    
    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Logger et envoyer notification Telegram
    const rawTotal = price + addonTools.reduce((s, a) => s + a.price, 0)
    const bundleCount = 1 + addonTools.length
    const bundleDiscount = bundleCount >= 3 ? 0.15 : bundleCount >= 2 ? 0.1 : 0
    const totalPrice = Math.round(rawTotal * (1 - bundleDiscount) * 100) / 100
    console.log('💳 Clic sur bouton Stripe:', {
      toolId,
      toolName: tool.name,
      subscriptionType,
      price: totalPrice,
      addonCount: addonTools.length,
      sessionId: session.id
    })

    // Envoyer notification Telegram
    await sendTelegramNotification({
      toolId,
      toolName: tool.name,
      subscriptionType,
      price: totalPrice
    })

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Erreur Stripe:', error)
    return res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' })
  }
}

