/**
 * Libellé français d'un compteur de vues : « 0 vue », « 1 vue », « 2 vues ».
 * Retourne null si le compte n'est pas un nombre positif ou nul.
 */
export function formatViewCount(count) {
  const n = Number(count)
  if (!Number.isFinite(n) || n < 0) return null
  return `${n.toLocaleString('fr-FR')} ${n <= 1 ? 'vue' : 'vues'}`
}
