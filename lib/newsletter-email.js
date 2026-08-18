/**
 * Détection des inscriptions newsletter bots.
 * Pattern observé : ox.uhe.l.ik866@gmail.com (syllabes courtes + points + chiffres).
 * Gmail ignore les points : 3+ points dans la partie locale = quasi toujours un bot.
 */

const MAX_LOCAL_PART_LENGTH = 40
const MAX_DOTS_GMAIL = 2
const MAX_DOTS_OTHER = 3
const MAX_SEGMENTS = 5
const MAX_SINGLE_CHAR_SEGMENTS = 2

export function normalizeNewsletterEmail(email) {
  const trimmed = String(email || '').toLowerCase().trim()
  const at = trimmed.lastIndexOf('@')
  if (at < 1) return trimmed

  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)

  if (/^(gmail|googlemail)\.com$/.test(domain)) {
    const withoutPlus = local.split('+')[0]
    return `${withoutPlus.replace(/\./g, '')}@gmail.com`
  }

  return `${local}@${domain}`
}

export function isLikelyBotEmail(email) {
  const trimmed = String(email || '').toLowerCase().trim()
  const at = trimmed.lastIndexOf('@')
  if (at < 1) return true

  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  if (!local || !domain) return true

  if (local.length > MAX_LOCAL_PART_LENGTH) return true

  const isGmail = /^(gmail|googlemail)\.com$/.test(domain)
  const dots = (local.match(/\./g) || []).length
  if (isGmail && dots > MAX_DOTS_GMAIL) return true
  if (dots > MAX_DOTS_OTHER) return true

  // Fin en .chiffre.chiffre (ex. .66.4, .31.5)
  if (/\.\d+\.\d+$/.test(local)) return true

  const segments = local.split('.')
  if (segments.length > MAX_SEGMENTS) return true

  const singleCharSegments = segments.filter((s) => s.length === 1).length
  if (singleCharSegments > MAX_SINGLE_CHAR_SEGMENTS) return true

  const shortSegments = segments.filter((s) => s.length <= 2).length
  if (segments.length >= 4 && shortSegments >= 3) return true

  const last = segments[segments.length - 1] || ''

  // ox.uhe.l.ik866 : 4+ chunks, une lettre seule, suffixe chiffres
  if (segments.length >= 4 && singleCharSegments >= 1 && /\d/.test(last)) {
    return true
  }

  // xx.xxx.xx.xxxNN : syllabes très courtes + 2+ chiffres en fin
  if (
    segments.length >= 4 &&
    segments.slice(0, -1).every((s) => s.length <= 3) &&
    /\d{2,}$/.test(last)
  ) {
    return true
  }

  return false
}
