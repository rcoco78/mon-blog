/**
 * Catalogue Datareacher — quelques fiches phares.
 * Le Store Apify n’est pas branché : chaque scraper tourne sur Render.
 */

export const FREE_ROWS = 20

export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    euros: 20,
    credits: 400,
    blurb: 'Pour tester après une vidéo.',
    envPrice: 'STRIPE_PRICE_STARTER',
  },
  {
    id: 'standard',
    name: 'Standard',
    euros: 50,
    credits: 1200,
    blurb: 'Le pack de la démo longue.',
    popular: true,
    envPrice: 'STRIPE_PRICE_STANDARD',
  },
  {
    id: 'pro',
    name: 'Pro',
    euros: 150,
    credits: 4200,
    blurb: 'Volume, même wallet.',
    envPrice: 'STRIPE_PRICE_PRO',
  },
]

export const scrapers = [
  {
    slug: 'airbnb-hosts',
    name: 'Airbnb · emails d’hôtes pro',
    category: 'Travel',
    promise: 'Hôtes professionnels d’une ville, email et téléphone publics.',
    inputLabel: 'Ville',
    inputKey: 'city',
    placeholder: 'Paris',
    creditsPerRow: 4,
    unit: 'contact',
    youtubePath: '/s/airbnb-hosts',
    featured: true,
  },
  {
    slug: 'instagram-handles',
    name: 'Instagram · dispo des handles',
    category: 'Social',
    promise: 'Vérifie en masse si un @ est libre.',
    inputLabel: 'Handles (un par ligne)',
    inputKey: 'handles',
    placeholder: 'corentin\ndatareacher\nlogementatypique',
    creditsPerRow: 1,
    unit: 'handle',
    youtubePath: '/s/instagram-handles',
    featured: true,
  },
  {
    slug: 'social-handles',
    name: 'Social · 15 réseaux',
    category: 'Social',
    promise: 'Disponibilité d’un handle sur IG, TikTok, X, YouTube…',
    inputLabel: 'Handles (un par ligne)',
    inputKey: 'handles',
    placeholder: 'corentin',
    creditsPerRow: 2,
    unit: 'ligne',
    youtubePath: '/s/social-handles',
    featured: true,
  },
  {
    slug: 'booking-hotels',
    name: 'Booking · hôtels d’une ville',
    category: 'Travel',
    promise: 'Listings, prix, notes — au-delà du cap Booking.',
    inputLabel: 'Destination',
    inputKey: 'destination',
    placeholder: 'Lyon',
    creditsPerRow: 2,
    unit: 'hôtel',
    youtubePath: '/s/booking-hotels',
    featured: true,
  },
  {
    slug: 'investorlift',
    name: 'InvestorLift · deals US',
    category: 'Immo',
    promise: 'Wholesale US, emails et tél. vendeurs.',
    inputLabel: 'État (US)',
    inputKey: 'state',
    placeholder: 'FL',
    creditsPerRow: 3,
    unit: 'deal',
    youtubePath: '/s/investorlift',
    featured: false,
  },
  {
    slug: 'siren-fr',
    name: 'Entreprises FR · SIREN',
    category: 'KYB',
    promise: 'Registre INSEE, dirigeants, NAF. Les SIREN en échec ne sont pas facturés.',
    inputLabel: 'SIREN (un par ligne)',
    inputKey: 'sirens',
    placeholder: '552032534',
    creditsPerRow: 3,
    unit: 'SIREN',
    youtubePath: '/s/siren-fr',
    featured: true,
  },
  {
    slug: 'orias',
    name: 'ORIAS · intermédiaires assurance',
    category: 'KYB',
    promise: 'COA, CIF et contacts du registre.',
    inputLabel: 'Recherche',
    inputKey: 'query',
    placeholder: 'Paris',
    creditsPerRow: 2,
    unit: 'fiche',
    youtubePath: '/s/orias',
    featured: false,
  },
  {
    slug: 'booking-availability',
    name: 'Booking · dispos jour par jour',
    category: 'Travel',
    promise: 'Calendrier tarifaire jusqu’à 180 jours.',
    inputLabel: 'URL hôtel Booking',
    inputKey: 'url',
    placeholder: 'https://www.booking.com/hotel/...',
    creditsPerRow: 6,
    unit: 'calendrier',
    youtubePath: '/s/booking-availability',
    featured: false,
  },
]

export function getScraper(slug) {
  return scrapers.find((item) => item.slug === slug) || null
}

export function rowsForPack(pack, creditsPerRow) {
  return Math.floor(pack.credits / creditsPerRow)
}

export function creditHint(scraper) {
  const pack = CREDIT_PACKS.find((item) => item.popular) || CREDIT_PACKS[1]
  const rows = rowsForPack(pack, scraper.creditsPerRow)
  return `${scraper.creditsPerRow} crédit${scraper.creditsPerRow > 1 ? 's' : ''} / ${scraper.unit} · pack ${pack.euros} € ≈ ${rows} ${scraper.unit}s`
}
