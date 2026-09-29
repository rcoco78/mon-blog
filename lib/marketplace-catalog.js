/** Règles d'affichage et d'indexation du catalogue marketplace. */

export const THIN_ROW_COUNT = 200

export const PACK_IAD_SAFTI = {
  href: 'https://buy.stripe.com/aFa7sK7Zb6nsccffnl1B60i',
  label: 'IAD + SAFTI · 300 € HT',
}

const FEATURED_RULES = [
  { test: (t) => /iad/i.test(hay(t)) && !/safti/i.test(hay(t)) },
  { test: (t) => /safti/i.test(hay(t)) },
  {
    test: (t) =>
      /agents[- ]immobiliers[- ]france/i.test(hay(t)) &&
      !/iad|safti|keller/i.test(hay(t)),
  },
  {
    test: (t) =>
      /agences[- ]immobil/i.test(hay(t)) && !/notaire|syndic/i.test(hay(t)),
  },
  { test: (t) => /capeb/i.test(hay(t)) },
  { test: (t) => /\bhse\b|qhse/i.test(hay(t)) },
]

function hay(tool) {
  return `${tool?.slug || ''} ${tool?.name || ''}`
}

function byRows(a, b) {
  return (Number(b?.rowCount) || 0) - (Number(a?.rowCount) || 0)
}

export function pickFeaturedDatabases(tools = []) {
  const used = new Set()
  const picked = []
  for (const rule of FEATURED_RULES) {
    const match = tools
      .filter((tool) => tool?.slug && !used.has(tool.slug) && rule.test(tool))
      .sort(byRows)[0]
    if (!match) continue
    used.add(match.slug)
    picked.push(match)
  }
  return picked
}

export function isIadOrSafti(slug = '') {
  return /iad|safti/i.test(String(slug))
}

/** Clé de réseau pour dédupliquer les fiches qui visent la même cible. */
export function networkKey(tool) {
  const text = hay(tool).toLowerCase()
  if (text.includes('iad')) return 'iad'
  if (text.includes('safti')) return 'safti'
  if (text.includes('keller')) return 'keller'
  if (text.includes('capeb')) return 'capeb'
  if (/\bhse\b|qhse/.test(text)) return 'hse'
  if (/agences[- ]immobil/.test(text) && !/notaire|syndic/.test(text)) return 'agences-immo'
  if (/agents[- ]immobiliers[- ]france/.test(text)) return 'agents-immo'
  return null
}

export function shouldNoindexDatabase(tool, siblings = []) {
  const rows = Number(tool?.rowCount) || 0
  if (rows < THIN_ROW_COUNT) return true
  const key = networkKey(tool)
  if (!key) return false
  const same = siblings.filter((item) => networkKey(item) === key)
  if (same.length < 2) return false
  const max = Math.max(...same.map((item) => Number(item.rowCount) || 0))
  return rows < max
}
