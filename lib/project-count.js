/**
 * Source de vérité pour le libellé « projets réalisés ».
 * Total = Malt + Fiverr (profils publics), pas Malt seul.
 */

import { siteConfig } from './config'

export function getMaltProjectsCount() {
  return siteConfig.socialProof?.malt?.projects || 0
}

export function getFiverrProjectsCount() {
  return siteConfig.socialProof?.fiverr?.projects || 0
}

/** Total Malt + Fiverr (source de vérité config). */
export function getTotalProjectsCount() {
  const malt = getMaltProjectsCount()
  const fiverr = getFiverrProjectsCount()
  return malt + fiverr
}

export function getProjectsCountValue(metrics) {
  const total = getTotalProjectsCount()
  if (total > 0) return total

  const metric = (metrics || []).find((m) => m.label === 'projets réalisés')
  if (metric?.value) {
    const raw = String(metric.value).replace(/[^\d]/g, '')
    const n = parseInt(raw, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

/** Ex. "448+ projets" ou "centaines de missions" */
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
