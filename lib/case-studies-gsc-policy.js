/**
 * Politique SEO issue des top pages Search Console (3 derniers mois).
 *
 * Objectif :
 * - garder les landings qui convertissent en clics
 * - noindex les pages qui captent des impressions sans clics (diluent le site)
 * - fusionner les clusters en doublon via redirections 301
 *
 * Source : GSC « Pages les plus populaires », mars–juin 2026 environ.
 */

/** Pages qui performent — forcer l’indexation */
export const FORCE_INDEX_SLUGS = new Set([
  'scraping-letrot-extraction-des-donnees-de-courses', // 16 clics
  'scraping-facebook-extraction-des-transcriptions-de-videos', // 10
  'scraping-telegram-ajout-de-membres-a-un-groupe-ou-canal', // 7
  'scraping-onlyfans-telechargement-de-contenu-multimedia', // 7
  'scraping-uber-eats-extraction-des-donnees-api', // 6
  'scraping-zeturf-extraction-des-donnees-de-courses', // 6
  'scraping-fnac-extraction-des-donnees-produits', // 6
  'scraping-google-maps-extraction-des-avis-et-evaluations', // 5
  'scraping-snapchat-extraction-des-stories-utilisateurs', // 5
  'scraping-telegram-extraction-des-membres-de-groupes', // 3
  'scraping-instagram-transcription-des-videos-reels', // 3
  'scraping-instagram-extraction-des-commentaires-gratuits', // 3
  'scraping-vinted-extraction-des-annonces-et-prix', // 3
  'scraping-temu-extraction-des-produits-en-ligne', // 3
  'scraping-leboncoin-automatisation-des-actions', // 3
  'scraping-apec-extraction-des-offres-d-emploi-executives', // 4
  'scraping-apec-extraction-des-offres-d-emploi', // 4
])

/**
 * Impressions sans aucun clic (top GSC) — noindex pour rendre le crawl budget
 * et éviter de concurrencer le blog / les landings qui marchent.
 */
export const NOINDEX_SLUGS = new Set([
  // 0 clic, beaucoup d’impressions
  'suivi-offres-emploi-indeed', // 130 imp
  'scraping-betalist-extraction-des-donnees-des-startups', // 114
  'scraping-devis-automatisation', // 81 — cluster devis
  'scraping-vinted-suivi-tendances-mode', // 79 — doublon Vinted
  'scraping-email-professionnel-trouver-des-adresses-en-masse', // 74
  'scraping-cadremploi-suivi-offres-emploi', // 72
  'scraping-email-finder-trouvez-des-emails-valides-rapidement', // 69
  'scraping-emails-verification-en-masse-des-adresses', // 66
  'scraping-email-scraper-pro-extraction-d-adresses-e-mail', // 56
  'scraping-devis-automatisation-2', // 53
  'scraping-devis-automatisation-3', // 49
  'devis-scraper-extraction-offres-services', // 48 — cluster devis
  'scraping-web-traffic-generer-du-trafic-authentique', // 48

  // CTR catastrophique malgré beaucoup d’impressions (peut cannibaliser le blog)
  'scraping-api-extraction-de-donnees-securisees', // 1 clic / 589 imp
])

/**
 * Redirections 301 : slug source → { sector, slug } canonique
 * Unifie les clusters qui se cannibalisent entre eux.
 */
export const CASE_STUDY_REDIRECTS = {
  // Cluster « devis scraper » → meilleure page (2 clics, 108 imp)
  'scraping-devis-automatisation': {
    sector: 'services',
    slug: 'devis-scraper-collecte-offres-services',
  },
  'scraping-devis-automatisation-2': {
    sector: 'services',
    slug: 'devis-scraper-collecte-offres-services',
  },
  'scraping-devis-automatisation-3': {
    sector: 'services',
    slug: 'devis-scraper-collecte-offres-services',
  },
  'devis-scraper-extraction-offres-services': {
    sector: 'services',
    slug: 'devis-scraper-collecte-offres-services',
  },

  // Cluster email (0 clic) → page téléphone entreprise qui a des clics, ou noindex only
  // On noindex seulement (pas de redirection vers une intention différente)

  // Vinted tendances (0 clic) → Vinted annonces/prix (3 clics)
  'scraping-vinted-suivi-tendances-mode': {
    sector: 'e-commerce',
    slug: 'scraping-vinted-extraction-des-annonces-et-prix',
  },
}

/**
 * Applique la politique GSC sur un case study (forceIndex / noindex).
 * Mutatif-safe : retourne un nouvel objet flags.
 */
export function applyGscIndexPolicy(caseStudy) {
  if (!caseStudy?.slug) {
    return { forceIndex: false, noindex: true }
  }

  const slug = caseStudy.slug
  if (FORCE_INDEX_SLUGS.has(slug) || caseStudy.forceIndex === true) {
    return { forceIndex: true, noindex: false }
  }
  if (NOINDEX_SLUGS.has(slug) || caseStudy.noindex === true) {
    return { forceIndex: false, noindex: true }
  }
  if (CASE_STUDY_REDIRECTS[slug]) {
    // Les pages redirigées ne doivent pas être indexées
    return { forceIndex: false, noindex: true }
  }
  return {
    forceIndex: caseStudy.forceIndex === true,
    noindex: caseStudy.noindex === true,
  }
}

export function getCaseStudyRedirect(slug) {
  return CASE_STUDY_REDIRECTS[slug] || null
}
