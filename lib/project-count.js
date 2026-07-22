/**
 * Source de vérité pour le libellé « projets réalisés ».
 * Préfère la métrique live, sinon formulation stable.
 */

export function getProjectsCountValue(metrics) {
  const metric = (metrics || []).find((m) => m.label === 'projets réalisés')
  if (!metric?.value) return null
  const raw = String(metric.value).replace(/[^\d]/g, '')
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Ex. "265+" ou "centaines de missions" */
export function getProjectsCountPhrase(metrics, { withPlus = true } = {}) {
  const n = getProjectsCountValue(metrics)
  if (n) return withPlus ? `${n}+ projets` : `${n} projets`
  return 'centaines de missions'
}

/** Pour libellés courts SEO / trust bars */
export function getProjectsCountShort(metrics) {
  const n = getProjectsCountValue(metrics)
  if (n) return `${n}+`
  return 'centaines de'
}
