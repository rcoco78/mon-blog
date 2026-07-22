/**
 * Helpers d'affichage marketplace (homepage et listes).
 * Objectif : fiches courtes, lisibles, vendables.
 */

/** Titre court à partir d'un nom SEO long. */
export function shortMarketplaceTitle(name = '') {
  if (!name) return 'Base de données'

  let title = String(name)
    .replace(/\s*[-–—|]\s*base\s+de\s+donn[eé]es.*$/i, '')
    .replace(/^base\s+de\s+donn[eé]es\s+/i, '')
    .replace(/\s+base\s+de\s+donn[eé]es\s*$/i, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
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

/** Titre homepage : "Base IAD France — 14 013 entrées" */
export function marketplaceHomeTitle(tool) {
  const base = shortMarketplaceTitle(tool?.name)
  const count = Number(tool?.rowCount) || 0
  if (count > 0) {
    return `${base} — ${count.toLocaleString('fr-FR')} entrées`
  }
  return base
}

/** Bénéfice en une phrase. */
export function marketplaceBenefit(tool) {
  const fromField = (tool?.benefit || tool?.shortDescription || '').trim()
  if (fromField) {
    const firstSentence = fromField.split(/(?<=[.!?])\s+/)[0].trim()
    if (firstSentence.length <= 160) return firstSentence
    return `${firstSentence.slice(0, 157).trim()}…`
  }

  const headers = Array.isArray(tool?.headers) ? tool.headers : []
  if (headers.length > 0) {
    return `${headers.slice(0, 4).join(', ')} pour prospecter rapidement.`
  }

  const desc = (tool?.description || '').trim()
  if (!desc) return 'Données structurées prêtes à l’emploi pour votre prospection.'
  const sentence = desc.split(/(?<=[.!?])\s+/)[0].trim()
  if (sentence.length <= 160) return sentence
  return `${sentence.slice(0, 157).trim()}…`
}

/** Prix affiché. */
export function marketplacePriceLabel(tool) {
  if (!tool?.isPaid) return 'Gratuit'
  const price = tool.annualPrice || tool.price
  if (price == null || price === '') return 'Sur devis'
  return `${Number(price).toLocaleString('fr-FR')} €`
}
