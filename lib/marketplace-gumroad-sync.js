/**
 * Sync marketplace databases → Gumroad
 * - buildGumroadDescription : génère une description markdown riche
 * - createOrUpdateGumroadProduct : crée ou met à jour un produit Gumroad
 */

const GUMROAD_API = 'https://api.gumroad.com/v2'
const SITE_URL = 'https://www.corentinrobert.fr'

// Mapping catégorie → slug (aligné avec marketplace-helpers)
const CATEGORY_TO_SLUG = {
  Immobilier: 'immobilier',
  Artisanat: 'artisanat',
  B2B: 'b2b',
  Finance: 'finance',
  'E-commerce': 'e-commerce',
  Retail: 'retail',
  Services: 'services',
  Santé: 'sante',
  Éducation: 'education',
  'Sport & Loisirs': 'sport-loisirs',
  'Beauté & Bien-être': 'beaute-bien-etre',
  Automobile: 'automobile',
  Hôtellerie: 'hotellerie',
  Juridique: 'juridique',
  'Transport & Logistique': 'transport-logistique',
  'Tourisme & Voyage': 'tourisme-voyage',
  Automatisation: 'automatisation',
  Autres: 'autres',
  Développement: 'developpement',
  'IA & Machine Learning': 'ia-machine-learning',
  'Médias & Actualités': 'medias-actualites',
  'Recrutement & RH': 'recrutement-rh',
  'Réseaux Sociaux & Lead Generation': 'reseaux-sociaux-lead-generation',
  'SEO & Analytics': 'seo-analytics',
  VC: 'vc',
  'Venture Capital': 'vc',
  'Capital Risque': 'vc',
}

function categoryToSlug(category) {
  if (!category) return 'autres'
  return CATEGORY_TO_SLUG[category] || 'autres'
}

// Taux EUR → USD pour le prix Gumroad (configurable via GUMROAD_EUR_TO_USD)
function getEurToUsdRate() {
  const rate = parseFloat(process.env.GUMROAD_EUR_TO_USD || '1.08')
  return isNaN(rate) ? 1.08 : rate
}

/**
 * Génère une description markdown riche pour la page produit Gumroad
 * @param {Object} database - Base marketplace
 * @returns {string} Description markdown
 */
function buildGumroadDescription(database) {
  const ed = database.enrichedData || {}
  const parts = []

  // Intro
  const intro = (database.shortDescription || database.description || '').trim()
  if (intro) {
    parts.push('## Description\n\n' + intro)
  }

  // Ce que vous recevez
  const rowCount = database.rowCount || 0
  const headers = database.headers || []
  const headersStr = headers.length > 0 ? headers.join(', ') : 'données structurées'

  parts.push('\n## Ce que vous recevez\n\n')
  parts.push(`- **${rowCount.toLocaleString('fr-FR')}** entrées qualifiées`)
  parts.push(`- Colonnes : ${headersStr}`)
  parts.push('- Format : Google Sheets (copie instantanée dans votre Drive)')

  // Cas d'usage
  const useCases = ed.useCases || []
  if (useCases.length > 0) {
    parts.push('\n## Cas d\'usage\n\n')
    useCases.slice(0, 6).forEach((uc) => {
      parts.push(`- ${uc}`)
    })
  }

  // Problèmes résolus
  const problem = ed.problem || []
  if (problem.length > 0) {
    parts.push('\n## Problèmes résolus\n\n')
    problem.slice(0, 4).forEach((p) => {
      parts.push(`- ${p}`)
    })
  }

  // Solutions apportées
  const solution = ed.solution || []
  if (solution.length > 0) {
    parts.push('\n## Solutions apportées\n\n')
    solution.slice(0, 4).forEach((s) => {
      parts.push(`- ${s}`)
    })
  }

  // Aperçu des données (tableau markdown)
  const sampleData = ed.sampleData || []
  if (sampleData.length > 0) {
    const cols = Object.keys(sampleData[0] || {})
    if (cols.length > 0) {
      parts.push('\n## Aperçu des données\n\n')
      parts.push('| ' + cols.join(' | ') + ' |')
      parts.push('| ' + cols.map(() => '---').join(' | ') + ' |')
      sampleData.slice(0, 3).forEach((row) => {
        const vals = cols.map((c) => String(row[c] || '-').replace(/\|/g, '\\|').slice(0, 50))
        parts.push('| ' + vals.join(' | ') + ' |')
      })
      parts.push(`\n*Exemple de ${Math.min(sampleData.length, 3)} entrée(s) sur ${rowCount.toLocaleString('fr-FR')} disponibles.*`)
    }
  }

  // FAQ
  const faq = ed.faq || []
  if (faq.length > 0) {
    parts.push('\n## FAQ\n\n')
    faq.slice(0, 5).forEach((item) => {
      const q = (item.question || '').trim()
      const a = (item.answer || '').trim()
      if (q && a) {
        parts.push(`**${q}**\n\n${a}\n\n`)
      }
    })
  }

  // Lien vers la page marketplace
  const categorySlug = categoryToSlug(database.category)
  const pageUrl = `${SITE_URL}/marketplace/${categorySlug}/${database.slug || ''}`
  parts.push('\n---\n\n')
  parts.push(`*[Voir la page détaillée sur corentinrobert.fr](${pageUrl})*`)

  return parts.join('\n').slice(0, 16000) // Limite raisonnable Gumroad
}

/**
 * Appelle l'API Gumroad (create ou update)
 * La doc officielle utilise access_token en paramètre ; on tente Bearer puis fallback
 * @param {string} method - GET, POST, PUT
 * @param {string} path - ex: /products ou /products/:id
 * @param {Object} [body] - Body JSON pour POST/PUT
 * @returns {Promise<Object>}
 */
async function gumroadRequest(method, path, body = null) {
  const token = process.env.GUMROAD_ACCESS_TOKEN
  if (!token) {
    throw new Error('GUMROAD_ACCESS_TOKEN manquant')
  }

  let url = path.startsWith('http') ? path : `${GUMROAD_API}${path}`
  // La doc officielle Gumroad utilise access_token en query/body
  const separator = url.includes('?') ? '&' : '?'
  url = `${url}${separator}access_token=${encodeURIComponent(token)}`

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data?.errors || data?.message || data?.error || res.statusText
    throw new Error(`Gumroad API ${res.status}: ${JSON.stringify(msg)}`)
  }

  return data
}

/**
 * Crée ou met à jour un produit Gumroad pour une base marketplace
 * @param {Object} database - Base marketplace
 * @param {Object} mapping - Mapping existant { slug: { productId, ... } }
 * @returns {Promise<{ slug, productId, permalink, created: boolean }|null>}
 */
async function createOrUpdateGumroadProduct(database, mapping = {}) {
  if (typeof window !== 'undefined') return null

  const slug = (database.slug || '').trim()
  if (!slug) return null

  const description = buildGumroadDescription(database)
  const deliveryUrl = (database.sheetUrl || '').replace(/\/$/, '') + '/copy'

  // Prix : EUR → USD cents
  const priceEur = database.isPaid && database.price != null ? database.price : 0
  const rate = getEurToUsdRate()
  const priceUsdCents = Math.round(priceEur * rate * 100)

  const payload = {
    name: (database.name || slug).slice(0, 255),
    price: priceUsdCents,
    description,
    url: deliveryUrl,
  }

  const existing = mapping[slug]

  try {
    if (existing?.productId) {
      const result = await gumroadRequest('PUT', `/products/${existing.productId}`, payload)
      const product = result?.product || result
      return {
        slug,
        productId: product.id || existing.productId,
        permalink: product.permalink || slug,
        created: false,
      }
    }

    const result = await gumroadRequest('POST', '/products', payload)
    const product = result?.product || result
    if (!product?.id) {
      throw new Error('Réponse Gumroad invalide: pas de product.id')
    }
    return {
      slug,
      productId: product.id,
      permalink: product.permalink || slug,
      created: true,
    }
  } catch (err) {
    console.warn(`[marketplace-gumroad-sync] ${slug}:`, err.message)
    return null
  }
}

module.exports = {
  buildGumroadDescription,
  createOrUpdateGumroadProduct,
}
