import Stripe from 'stripe'
import { put } from '@vercel/blob'
import { buffer } from 'micro'
import { captureServerEvent, captureServerException, identifyServerUser } from '../../../lib/posthog-server'

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
        console.warn('Déduction toolIds depuis line_items échouée:', e.message)
      }

      if (effectiveToolIds.length === 0) {
        const toolIdsRaw = session.metadata?.toolIds
        effectiveToolIds = toolIdsRaw
          ? toolIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
          : (toolId ? [toolId] : [])
        if (effectiveToolIds.length === 0 && toolId) effectiveToolIds = [toolId]
      }
      effectiveToolIds = [...new Set(effectiveToolIds)]

      const email = session.customer_email || session.metadata?.email
      const subscriptionType = session.metadata?.subscriptionType || 'one-time'
      const isSubscription = session.mode === 'subscription'

      // Récupérer les champs personnalisés (format, nom entreprise, etc.)
      const customFields = session.custom_fields || []
      const formatPreference = customFields.find(field => field.key === 'format_preference')?.dropdown?.value || 'all'
      const companyNameCustom = customFields.find(field => field.key === 'company_name')?.text?.value || null

      // Infos professionnelles : customer_details (nom, adresse) + tax_ids (n° TVA)
      const customerDetails = session.customer_details || {}
      const customerName = customerDetails.name || null
      const taxIds = customerDetails.tax_ids || []
      const vatNumber = taxIds.length > 0 ? taxIds[0].value : null
      const vatType = taxIds.length > 0 ? taxIds[0].type : null
      const companyName = companyNameCustom || customerName || null

      console.log(`Paiement confirmé pour ${effectiveToolIds.join(', ')} par ${email}`)
      console.log(`Format préféré: ${formatPreference}`)
      console.log(`Type: ${subscriptionType}${isSubscription ? ' (abonnement)' : ' (achat unique)'}`)
      if (companyName) console.log(`Entreprise: ${companyName}`)
      if (vatNumber) console.log(`N° TVA: ${vatNumber}`)

      const purchaseData = {
        toolId: toolId,
        toolIds: effectiveToolIds,
        email,
        sessionId: session.id,
        amount: session.amount_total / 100,
        amountTax: session.total_details?.amount_tax ? session.total_details.amount_tax / 100 : null,
        currency: session.currency,
        formatPreference,
        subscriptionType,
        isSubscription,
        subscriptionId: session.subscription || null,
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

      try {
        for (const tId of effectiveToolIds) {
          const data = { ...purchaseData, toolId: tId }
          const filename = `purchases/${tId}/${session.id}.json`
          await put(filename, JSON.stringify(data, null, 2), { access: 'public' })
        }
      } catch (error) {
        console.error('Erreur enregistrement achat:', error)
        await captureServerException(error, req, { flow: 'stripe_webhook_persist' })
      }

      try {
        const distinctId = email || session.id
        if (email) {
          await identifyServerUser(email, { email })
        }
        await captureServerEvent(req, 'purchase_completed', {
          tool_id: toolId,
          tool_ids: effectiveToolIds,
          amount: session.amount_total / 100,
          currency: session.currency,
          subscription_type: subscriptionType,
          is_subscription: isSubscription,
          stripe_session_id: session.id,
        }, distinctId)
      } catch (analyticsError) {
        console.warn('PostHog purchase_completed:', analyticsError)
      }
    }
  }

  return res.status(200).json({ received: true })
}

