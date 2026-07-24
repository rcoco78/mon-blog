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

function isMissionMaltKeyResult(kr) {
  const name = (kr?.name || '').trim().toLowerCase()
  return name === 'mission malt'
}

function isMissionFiverrKeyResult(kr) {
  const name = (kr?.name || '').trim().toLowerCase()
  return name === 'mission fiverr'
}

/**
 * Remplace currentResult Notion (souvent à 0 / en retard) pour Mission Malt & Mission Fiverr
 * par les compteurs publics configurés (même source que la homepage).
 */
export function enrichKeyResultsWithMarketplaceProof(keyResults) {
  if (!Array.isArray(keyResults) || keyResults.length === 0) return keyResults

  const malt = getMaltProjectsCount()
  const fiverr = getFiverrProjectsCount()

  return keyResults.map((kr) => {
    let current = null
    let liveSource = null

    if (malt > 0 && isMissionMaltKeyResult(kr)) {
      current = malt
      liveSource = 'malt-public-profile'
    } else if (fiverr > 0 && isMissionFiverrKeyResult(kr)) {
      current = fiverr
      liveSource = 'fiverr-public-profile'
    }

    if (current == null) return kr

    const target = Number(kr.targetResult) || 0
    const progress =
      target > 0 ? Math.round((current / target) * 1000) / 10 : kr.progress

    return {
      ...kr,
      currentResult: current,
      remaining: target > 0 ? target - current : kr.remaining,
      progress,
      liveSource,
    }
  })
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
