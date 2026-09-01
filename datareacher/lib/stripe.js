import Stripe from 'stripe'
import { CREDIT_PACKS } from './scrapers'

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export function packById(id) {
  return CREDIT_PACKS.find((item) => item.id === id) || null
}

export async function createCreditCheckout({ packId, scraperSlug, successUrl, cancelUrl, customerEmail }) {
  const pack = packById(packId)
  if (!pack) throw new Error('Pack inconnu')

  const stripe = getStripe()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  const success = successUrl || `${origin}/account?paid=${pack.id}`
  const cancel = cancelUrl || `${origin}/pricing`

  if (!stripe) {
    return { demo: true, url: success }
  }

  const priceId = process.env[pack.envPrice]
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail || undefined,
    success_url: success,
    cancel_url: cancel,
    metadata: {
      packId: pack.id,
      credits: String(pack.credits),
      scraperSlug: scraperSlug || '',
    },
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: pack.euros * 100,
              product_data: {
                name: `Datareacher · ${pack.credits} crédits (${pack.name})`,
              },
            },
          },
        ],
  })

  return { demo: false, url: session.url }
}
