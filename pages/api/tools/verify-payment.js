import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sessionId } = req.body

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' })
  }

  try {
    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      const toolId = session.metadata?.toolId
      let effectiveToolIds = []

      try {
        const { getPriceIdToSlug } = await import('../../../lib/stripe-price-ids')
        const priceIdToSlug = await getPriceIdToSlug()
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

        for (const item of lineItems.data) {
          const priceId = item.price?.id
          if (priceId && priceIdToSlug[priceId]) {
            effectiveToolIds.push(priceIdToSlug[priceId])
          }
        }
      } catch (e) {
        console.warn('verify-payment: déduction toolIds:', e.message)
      }

      if (effectiveToolIds.length === 0) {
        const toolIdsRaw = session.metadata?.toolIds
        effectiveToolIds = toolIdsRaw
          ? toolIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
          : (toolId ? [toolId] : [])
        if (effectiveToolIds.length === 0 && toolId) effectiveToolIds = [toolId]
      }
      effectiveToolIds = [...new Set(effectiveToolIds)]

      // Liens de livraison uniquement après paiement (pas exposés sur la page publique)
      const deliveryUrls = {}
      try {
        const { getDatabaseBySlug } = await import('../../../lib/marketplace-databases')
        for (const slug of effectiveToolIds) {
          const db = await getDatabaseBySlug(slug)
          if (db?.sheetUrl) {
            deliveryUrls[slug] = `${db.sheetUrl.replace(/\/$/, '')}/copy`
          }
        }
      } catch (e) {
        console.warn('verify-payment: livraison Sheets:', e.message)
      }

      return res.status(200).json({
        paid: true,
        toolId,
        toolIds: effectiveToolIds,
        deliveryUrls,
        email: session.customer_email || session.metadata?.email,
      })
    }

    return res.status(200).json({ paid: false })
  } catch (error) {
    console.error('Erreur vérification paiement:', error)
    return res.status(500).json({ error: 'Erreur lors de la vérification du paiement' })
  }
}

