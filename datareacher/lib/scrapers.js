/**
 * Catalogue Datareacher — quelques fiches phares.
 */

export const FREE_ROWS = 20

export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Un shoot',
    euros: 20,
    credits: 400,
    blurb: 'Tu passes, tu prends, tu t’en vas.',
    envPrice: 'STRIPE_PRICE_STARTER',
  },
  {
    id: 'standard',
    name: 'La tournée',
    euros: 50,
    credits: 1200,
    blurb: 'Tu as de quoi faire.',
    popular: true,
    envPrice: 'STRIPE_PRICE_STANDARD',
  },
  {
    id: 'pro',
    name: 'Le stock',
    euros: 150,
    credits: 4200,
    blurb: 'Tu reviens plusieurs fois dans la semaine.',
    envPrice: 'STRIPE_PRICE_PRO',
  },
]

export const scrapers = [
  {
    slug: 'airbnb-hosts',
    name: 'Airbnb · emails d’hôtes pro',
    category: 'Voyage',
    promise: 'Les hôtes pro d’une ville. Email et téléphone, quand c’est public.',
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
    name: 'Instagram · @ libres',
    category: 'Réseaux',
    promise: 'Est-ce que ce @ est pris, ou tu peux le chopper.',
    inputLabel: 'Les @ (un par ligne)',
    inputKey: 'handles',
    placeholder: 'studio\nmaison\natelier',
    creditsPerRow: 1,
    unit: 'handle',
    youtubePath: '/s/instagram-handles',
    featured: true,
  },
  {
    slug: 'social-handles',
    name: 'Les @ · 15 réseaux',
    category: 'Réseaux',
    promise: 'Instagram, TikTok, X, YouTube… un seul passage.',
    inputLabel: 'Les @ (un par ligne)',
    inputKey: 'handles',
    placeholder: 'studio',
    creditsPerRow: 2,
    unit: 'ligne',
    youtubePath: '/s/social-handles',
    featured: true,
  },
  {
    slug: 'booking-hotels',
    name: 'Booking · hôtels d’une ville',
    category: 'Voyage',
    promise: 'Les hôtels d’une ville, avec les prix et les notes.',
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
    promise: 'Deals immo aux US, emails et tél des vendeurs.',
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
    name: 'Entreprises France',
    category: 'Entreprises',
    promise: 'Une liste de SIREN, tu repars avec dirigeants et contacts. Ce qui ne sort pas, tu ne paies pas.',
    inputLabel: 'Les SIREN (un par ligne)',
    inputKey: 'sirens',
    placeholder: '552032534',
    creditsPerRow: 3,
    unit: 'SIREN',
    youtubePath: '/s/siren-fr',
    featured: true,
  },
  {
    slug: 'orias',
    name: 'ORIAS · assurance',
    category: 'Entreprises',
    promise: 'Courtiers, les contacts du registre.',
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
    category: 'Voyage',
    promise: 'Les prix jour par jour, pour les semaines qui viennent.',
    inputLabel: 'Lien de l’hôtel',
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

export function shotHint(scraper) {
  return `20 ${scraper.unit}s pour goûter. Ensuite tu paies ce que tu emportes.`
}
