import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { toolId, email } = req.body

  if (!toolId) {
    return res.status(400).json({ error: 'Tool ID is required' })
  }

  // Mapping des outils avec leurs prix
  const toolPrices = {
    'dentistes-parisiens': {
      name: 'Base de données - Dentistes Parisiens',
      price: 49, // Prix en euros
      description: 'Base de données complète des dentistes à Paris (500+ entrées)'
    }
  }

  const tool = toolPrices[toolId]
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' })
  }

  try {
    // Créer une session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: tool.name,
              description: tool.description,
            },
            unit_amount: tool.price * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/outils/${toolId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/outils/${toolId}?payment=cancelled`,
      customer_email: email || undefined,
      metadata: {
        toolId: toolId,
        email: email || '',
      },
    })

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Erreur Stripe:', error)
    return res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' })
  }
}

