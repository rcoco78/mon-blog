/**
 * Date calendaire affichée : « 10 août 2026 ».
 * Une chaîne AAAA-MM-JJ est lue comme jour civil, pas comme minuit UTC.
 */
export function formatFrenchDate(value) {
  if (value == null || value === '') return ''
  const raw = String(value).trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
