/**
 * Helpers d'affichage marketplace (homepage et listes).
 * Objectif : fiches courtes, lisibles, vendables.
 */

/**
 * Titres visibles, modèle « Mandataires IAD France » :
 * qui + réseau ou métier + géo, 3 à 6 mots, un titre par fiche.
 * Les slugs d’URL ne sont pas dérivés de ces libellés.
 */
const TITLE_BY_SLUG = {
  'base-donnees-agents-immobiliers-iad-france': 'Mandataires IAD France',
  'base-donnees-conseillers-immobiliers-safti-france': 'Mandataires SAFTI France',
  'agents-immobiliers-france-base-donnees': 'Agents immobiliers indépendants France',
  'conseillers-immobiliers-france-base-donnees': 'Conseillers immobiliers France',
  'mandataires-immobilier-france-base-donnees': 'Mandataires immobiliers France',
  'contacts-mandataires-immobiliers-france': 'Mandataires immobiliers avec email',
  'base-donnees-contacts-agents-immobiliers-france': 'Agents immobiliers avec téléphone',
  'contacts-agences-immobilieres-france': 'Agences immobilières avec annonces',
  'bases-donnees-agences-immobilieres-france': 'Agences immobilières avec email',
  'contacts-agences-immobilieres-notaires-france-base-donnees': 'Agences immobilières et notaires',
  'agences-immobilieres-notaires-france-base-donnees': 'Startups françaises levées de fonds',
  'architectes-interieur-paris-base-donnees': 'Architectes d’intérieur à Paris',
  'base-donnees-logements-airbnb-annecy-france': 'Logements Airbnb lac d’Annecy',
  'courchevel-airbnb-professionnal-host-scraping-apify-conseil-': 'Hôtes Airbnb à Courchevel',
  'base-donnees-artisans-batiment-capeb-france': 'Artisans du bâtiment Capeb',
  'base-donnees-contacts-hse-qhse-france': 'Responsables HSE en entreprise',
  'base-donnees-agences-gestion-patrimoine-france': 'Cabinets CGP France',
  'contacts-cgp-france-base-donnees': 'CGP indépendants France',
  'conseillers-gestion-patrimoine-france-base-donnees': 'CGP agréés AMF France',
  'contacts-conseillers-financiers-france': 'Conseillers financiers France',
  'contacts-courtiers-independants-france-base-donnees': 'Courtiers indépendants France',
  'produits-cogex-conseil-gestion-patrimoine-base-donnees': 'Catalogue produits Cogex',
  'investisseurs-capital-risque-suisse': 'Investisseurs capital-risque Suisse',
  'base-donnees-agences-comptables-experts-france': 'Experts-comptables en France',
  'base-donnees-avocats-specialises-bourg-en-bresse-france': 'Avocats sociétés Bourg-en-Bresse',
  'base-donnees-contacts-administrateurs-judiciaires-france': 'Administrateurs judiciaires France',
  'base-donnees-masseurs-kinesitherapeutes-france': 'Kinésithérapeutes Doctolib France',
  'base-donnees-creches-micro-creches-france': 'Crèches et micro-crèches France',
  'base-donnees-entreprises-services-numeriques-numeum': 'Entreprises numériques Numeum',
  'contacts-professionnels-learning-hr-france': 'Professionnels learning et RH',
  'contacts-b2b-risk-management-france': 'Professionnels risk management France',
  'contacts-professionnels-geneve-base-donnees': 'Professionnels LinkedIn à Genève',
  'base-donnees-contacts-professionnels-paris-09': 'Clients rendez-vous Paris 9e',
  'contacts-ecoles-internationales-etats-unis-base-donnees': 'Écoles internationales aux États-Unis',
  'hotels-ajaccio-corse-base-donnees': 'Hôtels Ajaccio en Corse',
  'clubs-randonnee-france-base-donnees': 'Clubs de randonnée France',
  'clubs-sportifs-italie-base-donnees': 'Clubs sportifs en Italie',
  'contacts-acheteurs-importateurs-vin-wine-paris-base-donnees': 'Acheteurs vin Wine Paris',
  'contacts-b2b-exposants-millesime-bio-europe': 'Exposants Millésime Bio Europe',
  'contacts-visiteurs-prowein-2023-base-donnees': 'Visiteurs salon ProWein',
  'vins-france-2024-base-donnees': 'Vins français millésime 2024',
  'contacts-b2b-changenow-2026-base-donnees': 'Participants ChangeNOW 2026',
  'contacts-b2b-davos-ai-house-base-donnees': 'Participants Davos AI House',
  'contacts-professionnels-start-summit-2026-base-donnees': 'Participants Start Summit 2026',
  'base-donnees-ecommerce-produits-france': 'Produits e-commerce spécialisés France',
  'base-donnees-produits-ichard-fr-ecommerce': 'Produits e-commerce Ichard',
  'base-donnees-sites-ecommerce-antiques-collectibles': 'Boutiques antiquités et collections',
  'produits-ecommerce-staycation-prix-experiences': 'Séjours Staycation avec prix',
  'restaurants-tripadvisor-uk-base-donnees': 'Restaurants TripAdvisor Royaume-Uni',
  'missions-b2b-prospection-base-donnees': 'Missions de prospection B2B',
}

/** Fiches sans entrée de map : même style, sans le préfixe catalogue. */
function readableMarketplaceTitle(name = '') {
  let title = String(name)
    .replace(/^base\s+de\s+donn[eé]es\s*[-–—:]?\s*/i, '')
    .replace(/\s*[-–—|]\s*base\s+de\s+donn[eé]es.*$/i, '')
    .replace(/\s+base\s+de\s+donn[eé]es\s*$/i, '')
    .replace(/^contacts?\s+/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s*[-–—]\s*apify.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  const words = title.split(' ').filter(Boolean)
  if (words.length > 6) title = words.slice(0, 6).join(' ')
  if (!title) return 'Fiche marketplace'
  return title.charAt(0).toUpperCase() + title.slice(1)
}

/** Titre court à partir d'un nom SEO long. */
export function shortMarketplaceTitle(name = '') {
  return readableMarketplaceTitle(name)
}

const DISTINCTIVE_BY_NETWORK = {
  iad: 'Mandataires IAD France',
  safti: 'Mandataires SAFTI France',
  'agents-immo': 'Agents immobiliers indépendants France',
  'agences-immo': 'Sociétés d’agences immobilières France',
  capeb: 'Artisans du bâtiment Capeb',
  hse: 'Responsables HSE en entreprise',
}

/** Aligné sur networkKey (marketplace-catalog) pour les titres différenciants. */
function displayNetworkKey(tool = {}) {
  const text = `${tool?.slug || ''} ${tool?.name || ''}`.toLowerCase()
  if (text.includes('iad')) return 'iad'
  if (text.includes('safti')) return 'safti'
  if (text.includes('keller')) return 'keller'
  if (text.includes('capeb')) return 'capeb'
  if (/\bhse\b|qhse/.test(text)) return 'hse'
  if (/agences[- ]immobil/.test(text) && !/notaire|syndic/.test(text)) return 'agences-immo'
  if (/agents[- ]immobiliers[- ]france/.test(text)) return 'agents-immo'
  return null
}

/**
 * Titre qui dit ce qui différencie la base (réseau, personnes vs sociétés, métier).
 * Priorité : slug, puis volume quand le slug est partagé, puis réseau featured, puis nom nettoyé.
 */
export function marketplaceDistinctiveTitle(tool = {}) {
  const slug = String(tool?.slug || '')
  const name = String(tool?.name || '')
  const rows = Number(tool?.rowCount) || 0

  if (slug === 'base-donnees-agences-immobilieres-france') {
    if (/syndic/i.test(name)) return 'Agences immobilières et syndics'
    if (/compl[eè]te/i.test(name)) return 'Agences immobilières ORIAS'
    return 'Conciergeries et hôtes France'
  }

  if (slug === 'agences-immobilieres-france-base-donnees') {
    if (rows >= 10000) return 'Sociétés d’agences immobilières France'
    return 'Dirigeants d’agences immobilières'
  }

  if (TITLE_BY_SLUG[slug]) return TITLE_BY_SLUG[slug]

  const key = displayNetworkKey(tool)
  if (key && DISTINCTIVE_BY_NETWORK[key] && key !== 'agences-immo' && key !== 'agents-immo') {
    return DISTINCTIVE_BY_NETWORK[key]
  }

  return readableMarketplaceTitle(name)
}

/** Titre liste : distinction métier/réseau, sans volume (déjà dans la meta). */
export function marketplaceHomeTitle(tool) {
  return marketplaceDistinctiveTitle(tool)
}

/**
 * Phrases shortlist : ce qui distingue cette base des cinq autres.
 * Une ligne, sans lister les champs déjà en meta, sans chiffres inventés.
 */
const BENEFIT_BY_NETWORK = {
  iad: 'Mandataires du réseau IAD, à appeler un par un.',
  safti: 'L’autre grand réseau de mandataires, à ne pas mélanger avec IAD.',
  'agents-immo': 'Agents immobiliers qui ne sont ni chez IAD ni chez SAFTI.',
  'agences-immo': 'Les sociétés d’agences, pas les mandataires, avec LinkedIn.',
  capeb: 'Artisans adhérents Capeb, joignables sur leur commune.',
  hse: 'Responsables HSE en entreprise : on leur écrit, pas d’appel, LinkedIn.',
}

/**
 * Clause hors shortlist, à partir des colonnes réelles (sans répéter le titre).
 * email+téléphone → joindre ; email seul → écrire ; téléphone seul → appeler ;
 * ville → situer ; LinkedIn → retrouver sur LinkedIn.
 */
function contactCapabilityClause(labels = []) {
  const hasEmail = labels.includes('email')
  const hasPhone = labels.includes('téléphone')
  const hasCity = labels.includes('ville')
  const hasLinkedIn = labels.includes('LinkedIn')

  const actions = []
  if (hasEmail && hasPhone) actions.push('les joindre')
  else if (hasEmail) actions.push('les écrire')
  else if (hasPhone) actions.push('les appeler')
  if (hasCity) actions.push('les situer')
  if (hasLinkedIn) actions.push('les retrouver sur LinkedIn')

  if (actions.length === 0) return null
  if (actions.length === 1) return `avec de quoi ${actions[0]}`
  if (actions.length === 2) return `avec de quoi ${actions[0]} et ${actions[1]}`
  return `avec de quoi ${actions.slice(0, -1).join(', ')} et ${actions[actions.length - 1]}`
}

/** Bénéfice en une phrase : à qui c’est + ce qu’on récupère (colonnes réelles). */
export function marketplaceBenefit(tool) {
  const key = displayNetworkKey(tool)
  if (key && BENEFIT_BY_NETWORK[key]) return BENEFIT_BY_NETWORK[key]

  const labels = notableColumnLabels(tool?.headers || [])
  const clause = contactCapabilityClause(labels)

  if (clause) {
    return `Contacts ciblés, ${clause}.`
  }

  const fromField = (tool?.benefit || tool?.shortDescription || '').trim()
  if (fromField && !isGenericGptBlurb(fromField)) {
    const firstSentence = fromField.split(/(?<=[.!?])\s+/)[0].trim()
    if (firstSentence.length <= 160) return firstSentence
    return `${firstSentence.slice(0, 157).trim()}…`
  }

  if (labels.length > 0) {
    return `Contacts ciblés (${labels.join(', ')}).`
  }

  return 'Contacts ciblés, prêts à prospecter.'
}

function isGenericGptBlurb(text = '') {
  return /^base\s+de\s+donn[eé]es\b/i.test(text) || /\bincluant\b/i.test(text)
}

const VAT_RATE = 1.2

export function formatEuros(amount) {
  return Number(amount).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Le prix catalogue est hors taxe. */
export function priceHT(amount) {
  return Math.round(Number(amount) * 100) / 100
}

export function priceTTC(amount) {
  return Math.round(Number(amount) * VAT_RATE * 100) / 100
}

const COLUMN_LABELS = [
  [/email/i, 'email'],
  [/t[eé]l|phone|mobile/i, 'téléphone'],
  [/linkedin/i, 'LinkedIn'],
  [/ville|city|localisation/i, 'ville'],
  [/code.?postal|\bcp\b/i, 'code postal'],
  [/\bsite\b|website|site.?web/i, 'site web'],
  [/siren|siret/i, 'SIRET'],
]

export function notableColumnLabels(headers = []) {
  const labels = []
  for (const [pattern, label] of COLUMN_LABELS) {
    if (headers.some((header) => pattern.test(String(header))) && !labels.includes(label)) {
      labels.push(label)
    }
  }
  return labels
}

function seoLabelFromTitle(title = '') {
  if (!title) return title
  return title.charAt(0).toLowerCase() + title.slice(1)
}

/** Titre SEO orienté requête, avec la même distinction que la liste. */
export function marketplaceSeoTitle(name = '', rowCount = 0, headers = [], slug = '') {
  const title = marketplaceDistinctiveTitle({ name, slug, rowCount })
  const label = seoLabelFromTitle(title)
  const count = Number(rowCount) || 0
  const formatted = count.toLocaleString('fr-FR')
  const hasEmail = notableColumnLabels(headers).includes('email')
  if (hasEmail && count > 0) return `Emails ${label} : ${formatted} contacts`
  if (count > 0) return `${title} : ${formatted} entrées`
  return title
}

/** Paragraphe de périmètre. Uniquement des faits du fichier. */
export function marketplaceScopeText({ name = '', slug = '', rowCount = 0, headers = [], date = '', category = '' }) {
  const title = marketplaceDistinctiveTitle({ name, slug, rowCount })
  const count = Number(rowCount) || 0
  const formatted = count.toLocaleString('fr-FR')
  const labels = notableColumnLabels(headers)
  const fields = labels.length
    ? `Champs présents : ${labels.join(', ')}.`
    : headers.length
      ? `${headers.length} colonnes dans le fichier.`
      : ''
  const parts = [
    count > 0 ? `${title}, ${formatted} entrées.` : `${title}.`,
    category ? `Catégorie ${category}.` : '',
    fields,
    date ? `Snapshot du ${date}.` : '',
    'Livré en Google Sheets, une copie dans votre Drive.',
  ]
  return parts.filter(Boolean).join(' ')
}

/** Prix affiché : TTC, le HT est en dessous sur les fiches et les listes. */
export function marketplacePriceLabel(tool) {
  if (!tool?.isPaid) return 'Gratuit'
  const price = tool.annualPrice || tool.price
  if (price == null || price === '') return 'Sur devis'
  return `${formatEuros(priceTTC(price))} €`
}
