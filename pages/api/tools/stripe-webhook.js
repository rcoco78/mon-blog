import Stripe from 'stripe'
import { put } from '@vercel/blob'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

// Désactiver le body parser pour recevoir le body brut (requis pour Stripe webhooks)
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  let event
  let body

  try {
    // Lire le body brut
    body = await buffer(req)
  } catch (err) {
    console.error('Error reading request body:', err)
    return res.status(400).json({ error: 'Error reading request body' })
  }

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Gérer les événements d'abonnement
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object
    console.log(`Abonnement ${event.type === 'created' ? 'créé' : 'mis à jour'}: ${subscription.id}`)
    // Ici tu peux gérer la création/mise à jour d'abonnement
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object
    if (invoice.subscription) {
      console.log(`Paiement d'abonnement réussi pour la subscription: ${invoice.subscription}`)
      // Ici tu peux envoyer les mises à jour annuelles
    }
  }

  // Gérer l'événement checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.payment_status === 'paid') {
      const toolId = session.metadata?.toolId
      const email = session.customer_email || session.metadata?.email
      
      // Récupérer les champs personnalisés (format préféré, etc.)
      const customFields = session.custom_fields || []
      const formatPreference = customFields.find(field => field.key === 'format_preference')?.value || 'all'

      // Ici tu peux :
      // 1. Envoyer l'email avec le lien de téléchargement
      // 2. Enregistrer l'achat dans une base de données
      // 3. Envoyer une notification Telegram
      
      console.log(`Paiement confirmé pour ${toolId} par ${email}`)
      console.log(`Format préféré: ${formatPreference}`)
      console.log(`Type: ${subscriptionType}${isSubscription ? ' (abonnement)' : ' (achat unique)'}`)
      
      // Récupérer le type de paiement (one-time ou annual)
      const subscriptionType = session.metadata?.subscriptionType || 'one-time'
      const isSubscription = session.mode === 'subscription'
      
      // Exemple : Enregistrer l'achat dans Vercel Blob
      try {
        const purchaseData = {
          toolId,
          email,
          sessionId: session.id,
          amount: session.amount_total / 100, // Convertir centimes en euros
          currency: session.currency,
          formatPreference: formatPreference, // Format sélectionné par l'utilisateur
          subscriptionType: subscriptionType, // 'one-time' ou 'annual'
          isSubscription: isSubscription,
          subscriptionId: session.subscription || null, // ID de l'abonnement si applicable
          timestamp: new Date().toISOString(),
        }

        const filename = `purchases/${toolId}/${session.id}.json`
        await put(filename, JSON.stringify(purchaseData, null, 2), {
          access: 'public',
        })
      } catch (error) {
        console.error('Erreur enregistrement achat:', error)
      }
    }
  }

  return res.status(200).json({ received: true })
}

