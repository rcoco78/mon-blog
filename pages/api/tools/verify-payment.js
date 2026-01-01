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
      // Le paiement est confirmé
      return res.status(200).json({
        paid: true,
        toolId: session.metadata?.toolId,
        email: session.customer_email || session.metadata?.email,
      })
    }

    return res.status(200).json({ paid: false })
  } catch (error) {
    console.error('Erreur vérification paiement:', error)
    return res.status(500).json({ error: 'Erreur lors de la vérification du paiement' })
  }
}

