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
      const subscriptionType = session.metadata?.subscriptionType || 'one-time'
      const isSubscription = session.mode === 'subscription'

      // Récupérer les champs personnalisés (format, nom entreprise, etc.)
      const customFields = session.custom_fields || []
      const formatPreference = customFields.find(field => field.key === 'format_preference')?.dropdown?.value || 'all'
      const companyNameCustom = customFields.find(field => field.key === 'company_name')?.text?.value || null

      // Infos professionnelles : customer_details (nom, adresse) + tax_ids (n° TVA)
      const customerDetails = session.customer_details || {}
      const customerName = customerDetails.name || null // Nom ou raison sociale
      const taxIds = customerDetails.tax_ids || []
      const vatNumber = taxIds.length > 0 ? taxIds[0].value : null // ex: FR12345678901
      const vatType = taxIds.length > 0 ? taxIds[0].type : null // ex: eu_vat
      // Quand l'utilisateur remplit le formulaire TVA, customerDetails.name = raison sociale
      const companyName = companyNameCustom || customerName || null

      console.log(`Paiement confirmé pour ${toolId} par ${email}`)
      console.log(`Format préféré: ${formatPreference}`)
      console.log(`Type: ${subscriptionType}${isSubscription ? ' (abonnement)' : ' (achat unique)'}`)
      if (companyName) console.log(`Entreprise: ${companyName}`)
      if (vatNumber) console.log(`N° TVA: ${vatNumber}`)

      // Enregistrer l'achat dans Vercel Blob avec toutes les infos
      try {
        const purchaseData = {
          toolId,
          email,
          sessionId: session.id,
          amount: session.amount_total / 100, // TTC (centimes → euros)
          amountTax: session.total_details?.amount_tax ? session.total_details.amount_tax / 100 : null,
          currency: session.currency,
          formatPreference,
          subscriptionType,
          isSubscription,
          subscriptionId: session.subscription || null,
          // Infos professionnelles
          companyName,
          vatNumber,
          vatType,
          customerName,
          billingAddress: customerDetails.address ? {
            line1: customerDetails.address.line1,
            line2: customerDetails.address.line2,
            city: customerDetails.address.city,
            postal_code: customerDetails.address.postal_code,
            country: customerDetails.address.country,
          } : null,
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

