/**
 * Une seule porte en fin d’article : Datareacher (listes / scripts / data)
 * ou Outreacher (outbound / Lemlist / campagne). Jamais les deux.
 */

const DATA_RE =
  /\b(listes?|scripts?|scraping|scrapers?|data|donn[ée]es?|extraction|apify|google sheets|bases?)\b/i
const OUTBOUND_RE =
  /\b(outbound|lemlist|campagnes?|prospection|cold\s*emails?|s[ée]quences?|sdr|outreach|outreacher)\b/i
const OUTBOUND_STRONG_RE = /\b(outbound|lemlist|campagnes?|prospection)\b/i
const DATA_STRONG_RE = /\b(scraping|scrapers?|scripts?|listes?|extraction|apify)\b/i

export function articleDoorHaystack({ title, tags, metaDescription, content } = {}) {
  return [title, metaDescription, ...(Array.isArray(tags) ? tags : []), content]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function pickArticleDoor(post = {}) {
  const hay = articleDoorHaystack(post)
  const hasData = DATA_RE.test(hay)
  const hasOutbound = OUTBOUND_RE.test(hay)

  if (hasOutbound && !hasData) return 'outreacher'
  if (hasData && !hasOutbound) return 'datareacher'

  if (hasOutbound && hasData) {
    if (OUTBOUND_STRONG_RE.test(hay) && !DATA_STRONG_RE.test(hay)) return 'outreacher'
    if (DATA_STRONG_RE.test(hay) && !OUTBOUND_STRONG_RE.test(hay)) return 'datareacher'
    if (OUTBOUND_STRONG_RE.test(hay)) return 'outreacher'
    return 'datareacher'
  }

  return 'datareacher'
}

export function getArticleDoor(post = {}, network = {}) {
  const id = pickArticleDoor(post)
  const door = network[id] || network.datareacher
  return door
}
