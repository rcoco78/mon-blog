/**
 * Modèle des flux PostHog du blog.
 *
 * Quatre parcours, un `flow` chacun. Les `$pageview` sont auto (SDK).
 * Recréer les funnels dans l’UI EU : Product analytics → Funnels,
 * filtre `flow = …` sur chaque étape.
 *
 * freelance    $pageview → cta_clicked → calendly_opened → calendly_scheduled
 * marketplace  $pageview → cta_clicked → checkout_started → purchase_completed
 * newsletter   $pageview → cta_clicked → newsletter_subscribed
 * journal      $pageview → cta_clicked (objectifs)
 */

export const FLOW = {
  freelance: 'freelance',
  marketplace: 'marketplace',
  newsletter: 'newsletter',
  journal: 'journal',
}

export const EVENT = {
  ctaClicked: 'cta_clicked',
  calendlyOpened: 'calendly_opened',
  calendlyScheduled: 'calendly_scheduled',
  newsletterSubscribed: 'newsletter_subscribed',
  checkoutStarted: 'checkout_started',
  purchaseCompleted: 'purchase_completed',
  contactSubmitted: 'contact_submitted',
  faqOpened: 'faq_opened',
}

/** Event serveur / client → flow par défaut (surchargeable via properties.flow). */
export const EVENT_FLOW = {
  [EVENT.ctaClicked]: null,
  [EVENT.calendlyOpened]: FLOW.freelance,
  [EVENT.calendlyScheduled]: FLOW.freelance,
  [EVENT.contactSubmitted]: FLOW.freelance,
  [EVENT.faqOpened]: FLOW.freelance,
  [EVENT.checkoutStarted]: FLOW.marketplace,
  [EVENT.purchaseCompleted]: FLOW.marketplace,
  [EVENT.newsletterSubscribed]: FLOW.newsletter,
}

export const FUNNELS = [
  {
    key: FLOW.freelance,
    name: 'Freelance — appel booké',
    description: 'Clic CTA → popup Calendly → créneau confirmé',
    steps: [EVENT.ctaClicked, EVENT.calendlyOpened, EVENT.calendlyScheduled],
    filter: { flow: FLOW.freelance },
  },
  {
    key: FLOW.marketplace,
    name: 'Marketplace — achat',
    description: 'Clic acheter → session Stripe → paiement OK',
    steps: [EVENT.ctaClicked, EVENT.checkoutStarted, EVENT.purchaseCompleted],
    filter: { flow: FLOW.marketplace },
  },
  {
    key: FLOW.newsletter,
    name: 'Audience — newsletter',
    description: 'Soumission formulaire → inscription confirmée',
    steps: [EVENT.ctaClicked, EVENT.newsletterSubscribed],
    filter: { flow: FLOW.newsletter },
  },
  {
    key: FLOW.journal,
    name: 'Journal — objectifs',
    description: 'Clic vers le journal public (pas une conversion €)',
    steps: [EVENT.ctaClicked],
    filter: { flow: FLOW.journal },
  },
]

export function enrichEventProperties(event, properties = {}) {
  const flow = properties.flow || EVENT_FLOW[event] || undefined
  return flow ? { ...properties, flow } : { ...properties }
}
