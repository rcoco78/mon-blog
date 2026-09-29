/**
 * Helpers d'affichage marketplace (homepage et listes).
 * Objectif : fiches courtes, lisibles, vendables.
 */

/** Titre court à partir d'un nom SEO long. */
export function shortMarketplaceTitle(name = '') {
  if (!name) return 'Base de données'

  let title = String(name)
    .replace(/\s*[-–—|]\s*base\s+de\s+donn[eé]es.*$/i, '')
    .replace(/^base\s+de\s+donn[eé]es\s*[-–—:]?\s*/i, '')
    .replace(/\s+base\s+de\s+donn[eé]es\s*$/i, '')
    .replace(/^[-–—]\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/['']/g, '')
    .trim()

  // Garder la partie avant le premier séparateur long si trop verbeux
  if (title.length > 56) {
    const cut = title.split(/\s[-–—:]\s/)[0]
    if (cut && cut.length >= 12) title = cut
  }

  if (title.length > 64) {
    title = `${title.slice(0, 61).trim()}…`
  }

  return title || name
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
 * Fallback : shortMarketplaceTitle.
 */
export function marketplaceDistinctiveTitle(tool = {}) {
  const key = displayNetworkKey(tool)
  if (key && DISTINCTIVE_BY_NETWORK[key]) return DISTINCTIVE_BY_NETWORK[key]
  return shortMarketplaceTitle(tool?.name)
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
  const title = marketplaceDistinctiveTitle({ name, slug })
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
  const title = marketplaceDistinctiveTitle({ name, slug })
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
