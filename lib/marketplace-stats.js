/**
 * Métriques marketplace pour priorisation (vues internes, etc.)
 * Utilisé par le sync Notion stratégie vidéo
 */

const VIEWS_EVENTS_FILENAME = 'marketplace-views-events.json'

/** Référence pour normaliser le score sur 0-100 (raw ~400 ≈ 100) */
const SCORE_REF = 400

/**
 * Calcule un score de priorité (0-100) pour produire la vidéo en premier
 * Favorise les bases avec fort potentiel (impressions, clics, vues, ventes, position) qui n'ont pas encore de vidéo
 *
 * @param {number} impressions - Search Console
 * @param {number} clicks - Search Console
 * @param {number} views - Vues internes
 * @param {boolean} hasVideo - Déjà une vidéo publiée
 * @param {number} ventes - Nombre de ventes Stripe
 * @param {number} [position] - Position moyenne SC (1-10 = page 1, 8-25 = quick wins)
 * @returns {number} Score 0-100 (plus haut = priorité)
 */
export function computePriorityScore(impressions = 0, clicks = 0, views = 0, hasVideo = false, ventes = 0, position = 0) {
  if (hasVideo) return 0
  let raw =
    impressions * 0.5 +   // Visibilité Google
    clicks * 15 +         // Intention forte (clic organique)
    views +               // Intérêt interne
    ventes * 50           // Preuve de demande (achat = forte priorité)

  // Bonus position : quick wins (pos 8-25) et page 1 (pos 1-7) priorisés
  if (position > 0) {
    if (position <= 7) raw += 40        // Déjà page 1, vidéo peut renforcer
    else if (position <= 15) raw += 50 // Sweet spot : proche page 1
    else if (position <= 25) raw += 35 // Bonne opportunité
    else if (position <= 50) raw += 15 // Potentiel modéré
  }

  return Math.min(100, Math.round((raw / SCORE_REF) * 100))
}

/**
 * Récupère les vues internes (marketplace-views-events) agrégées par slug
 * @returns {Promise<Record<string, number>>}
 */
export async function getMarketplaceViewsBySlug() {
  if (typeof window !== 'undefined') return {}

  try {
    const { list } = await import('@vercel/blob')
    const blobs = await list({ prefix: VIEWS_EVENTS_FILENAME })
    const blob = blobs.blobs?.find((b) => b.pathname === VIEWS_EVENTS_FILENAME)
    if (!blob) return {}

    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) return {}

    const events = await res.json()
    if (!Array.isArray(events)) return {}

    const views = {}
    for (const event of events) {
      const slug = event.slug
      if (!slug) continue
      views[slug] = (views[slug] || 0) + 1
    }
    return views
  } catch (e) {
    console.warn('[marketplace-stats] getMarketplaceViewsBySlug:', e.message)
    return {}
  }
}

/**
 * Récupère le nombre de ventes par base marketplace via l'API Stripe
 * Liste les sessions checkout complétées et mappe les line items (priceId) aux slugs
 * @returns {Promise<Record<string, number>>}
 */
export async function getMarketplaceSalesBySlug() {
  if (typeof window !== 'undefined') return {}
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[marketplace-stats] STRIPE_SECRET_KEY absent — ventes non récupérées')
    return {}
  }

  try {
    const Stripe = (await import('stripe')).default
    const { getPriceIdToSlug } = await import('./stripe-price-ids.js')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
    const priceIdToSlug = await getPriceIdToSlug()

    const sales = {}
    let hasMore = true
    let startingAfter
    let totalSessions = 0

    while (hasMore) {
      const params = { status: 'complete', limit: 100 }
      if (startingAfter) params.starting_after = startingAfter

      const sessions = await stripe.checkout.sessions.list(params)
      if (!sessions.data?.length) break
      totalSessions += sessions.data.length

      for (const session of sessions.data) {
        if (session.payment_status !== 'paid') continue
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        let sessionCounted = 0
        for (const item of lineItems.data || []) {
          const priceId = item.price?.id
          const slug = priceId ? priceIdToSlug[priceId] : null
          if (slug) {
            sales[slug] = (sales[slug] || 0) + (item.quantity || 1)
            sessionCounted += item.quantity || 1
          }
        }
        if (sessionCounted === 0 && session.metadata) {
          const toolIdsRaw = session.metadata.toolIds || session.metadata.toolId
          const slugs = toolIdsRaw
            ? String(toolIdsRaw).split(',').map((s) => s.trim()).filter(Boolean)
            : []
          for (const slug of slugs) {
            sales[slug] = (sales[slug] || 0) + 1
          }
        }
      }

      hasMore = sessions.has_more
      if (hasMore && sessions.data.length) {
        startingAfter = sessions.data[sessions.data.length - 1].id
      }
    }

    const salesCount = Object.values(sales).reduce((a, b) => a + b, 0)
    if (totalSessions > 0 && salesCount === 0) {
      console.warn('[marketplace-stats] Stripe:', totalSessions, 'sessions complétées mais 0 ventes mappées. Vérifiez metadata.toolIds ou stripe-price-ids.')
    }
    return sales
  } catch (e) {
    console.warn('[marketplace-stats] getMarketplaceSalesBySlug:', e.message)
    return {}
  }
}
