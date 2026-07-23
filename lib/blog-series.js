/**
 * Séries éditoriales du blog — source de vérité pour l’interlinking.
 * Un article peut appartenir à plusieurs séries ; getPrimarySeries choisit la meilleure.
 */

export const BLOG_SERIES = [
  {
    id: 'freelance-growth',
    title: 'Freelance & growth',
    hub: 'freelance-3-ans-malt-fiverr-affiliation-apify-logement-atypique',
    description: 'Sortir du 100 % time-for-money : missions, affiliation, scripts, produit.',
    slugs: [
      'freelance-3-ans-malt-fiverr-affiliation-apify-logement-atypique',
      'affiliation-saas-lemlist-100000-revenus-24-mois',
      'gagner-argent-apify-bilan-8-mois-location-scripts',
      'logement-atypique-genese-histoire-vision-plateforme',
      'chatseo-outrank-outils-ia-contenu-seo-automatique',
      'freelance-malt-fiverr-3-ans-lecons-apprises',
      'automatiser-candidatures-malt-freelance',
    ],
  },
  {
    id: 'apify-scraping',
    title: 'Apify & scraping',
    hub: 'gagner-argent-apify-bilan-8-mois-location-scripts',
    description: 'Actors, extraction de données et monétisation de scripts.',
    slugs: [
      'gagner-argent-apify-bilan-8-mois-location-scripts',
      'artisan-infra-pro-apify-scraping',
      'scraping-linkedin-guide-2026',
      'scraping-immobilier-recrutement-agents-agences',
      'prospection-airbnb-logement-atypique-apify-gpt4o-resend',
    ],
  },
  {
    id: 'logement-atypique',
    title: 'Logement Atypique',
    hub: 'logement-atypique-genese-histoire-vision-plateforme',
    description: 'Plateforme, acquisition et use cases terrain.',
    slugs: [
      'logement-atypique-genese-histoire-vision-plateforme',
      'capter-signal-marketing-instagram-logement-atypique',
      'prospection-airbnb-logement-atypique-apify-gpt4o-resend',
    ],
  },
  {
    id: 'seo-contenu',
    title: 'SEO & contenu',
    hub: 'chatseo-outrank-outils-ia-contenu-seo-automatique',
    description: 'Trafic organique et production de contenu à l’échelle.',
    slugs: [
      'chatseo-outrank-outils-ia-contenu-seo-automatique',
      'pseo-6500-pages-seo-strategie-trafic-organique',
      'automatisation-pinterest-100k-impressions-5-outils',
    ],
  },
  {
    id: 'automation-ops',
    title: 'Automatisation',
    hub: 'automatisations-zapier-gagner-temps',
    description: 'Workflows et outils pour gagner du temps.',
    slugs: [
      'automatisations-zapier-gagner-temps',
      'automatiser-candidatures-malt-freelance',
      'automatisation-pinterest-100k-impressions-5-outils',
    ],
  },
]

export function getSeriesForSlug(slug) {
  if (!slug) return []
  return BLOG_SERIES.filter((series) => series.slugs.includes(slug))
}

/** Série principale : hub > série la plus peuplée parmi celles du slug */
export function getPrimarySeries(slug, availableSlugs = null) {
  const matches = getSeriesForSlug(slug)
  if (matches.length === 0) return null

  const countMembers = (series) => {
    if (!availableSlugs) return series.slugs.length
    const set = new Set(availableSlugs)
    return series.slugs.filter((s) => set.has(s)).length
  }

  const asHub = matches.find((s) => s.hub === slug)
  if (asHub) return asHub

  return [...matches].sort((a, b) => countMembers(b) - countMembers(a))[0]
}

export function getSeriesPosts(series, allPosts, { excludeSlug } = {}) {
  if (!series || !Array.isArray(allPosts)) return []
  const bySlug = new Map(allPosts.map((p) => [p.slug, p]))
  return series.slugs
    .filter((s) => s !== excludeSlug)
    .map((s) => bySlug.get(s))
    .filter(Boolean)
}
