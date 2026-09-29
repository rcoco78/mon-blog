/**
 * Fiches /cas-usage/[sector]/[slug] à garder indexables.
 *
 * Source : PostHog projet « Mon Blog » (id 251458, token aligné lib/posthog-config.js),
 * pageviews $pageview sur 28 jours (filtre comptes de test projet).
 *
 * GSC Search Analytics API indisponible localement (API non activée sur le projet GCP
 * du service account) — aucun clic / impression inventé. Règle appliquée :
 * ≥ 1 pageview PostHog réel.
 *
 * Les pages liste /cas-usage et /cas-usage/[sector] restent indexables hors de cette liste.
 * Mesuré le 2026-09-29.
 */

export const CASE_STUDY_TRAFFIC_META = {
  measuredAt: '2026-09-29',
  windowDays: 28,
  posthogProjectId: 251458,
  posthogProjectName: 'Mon Blog / Default project',
  posthogOrganization: 'Mon Blog',
  gscAvailable: false,
  gscError:
    'Search Console API disabled on GCP project linked to GOOGLE_SERVICE_ACCOUNT_KEY',
  rule: 'keep if ≥1 PostHog pageview (GSC not measurable)',
}

/** Slugs avec ≥ 1 pageview PostHog sur 28 jours */
export const CASE_STUDY_INDEXABLE_SLUGS = new Set([
  'devis-scraper-collecte-offres-services',
  'scraping-agri-meteo-previsions-agriculteurs',
  'scraping-ahrefs-extraction-des-donnees-seo-cles',
  'scraping-amazon-suivi-prix',
  'scraping-apartments-extraction-des-donnees-immobilieres',
  'scraping-apec-suivi-offres-emploi-interim',
  'scraping-apec-suivi-profils-candidats',
  'scraping-api-gw-lite-automatisation-des-requetes-api',
  'scraping-apollo-leads-generer-des-brise-glaces-personnalises',
  'scraping-aws-waf-resoudre-les-captchas-rapidement',
  'scraping-bodega-aurrera-promotions-2',
  'scraping-cms-decouvrez-la-technologie-des-sites-web',
  'scraping-coronavirus-extraction-des-statistiques-en-russie',
  'scraping-coronavirus-extraction-des-statistiques-en-slovaquie',
  'scraping-credit-agricole-offres-bancaires',
  'scraping-devis-suivi-devis-en-ligne',
  'scraping-doctissimo-suivi-remedes',
  'scraping-doctolib-suivi-disponibilites-medicales',
  'scraping-doctolib-suivi-rendez-vous',
  'scraping-ecotransport-tendances-transport-durable',
  'scraping-edjoin-optimiser-votre-recrutement',
  'scraping-emails-collecte-intelligente-2',
  'scraping-emploi-automatisation-de-la-recherche-d-offres',
  'scraping-entreprise-trouver-le-numero-de-telephone',
  'scraping-facebook-extraction-des-emails-de-profils',
  'scraping-facebook-extraction-des-publications-publiques',
  'scraping-facebook-extraction-des-transcriptions-de-videos',
  'scraping-facebook-extraction-emails',
  'scraping-facebook-extraction-emails-marketing',
  'scraping-facebook-telechargement-de-videos-facilement',
  'scraping-fnac-extraction-des-donnees-produits',
  'scraping-gens-de-confiance-evaluations-services',
  'scraping-getyourguide-extraction-des-tours-et-activites',
  'scraping-google-trends-extraction-des-donnees-tendances',
  'scraping-hacker-news-extraction-des-donnees-pertinentes',
  'scraping-healthanalytics-tendances-sante-publique',
  'scraping-indeed-performance-offres-emploi',
  'scraping-infogreffe-suivi-depots-bilans',
  'scraping-instagram-extraction-des-commentaires-gratuits',
  'scraping-instagram-extraction-des-numeros-de-telephone',
  'scraping-instagram-transcription-des-videos-reels',
  'scraping-instant-web-data-extraction-de-donnees-de-sites',
  'scraping-jobteaser-extraction-des-offres-d-emploi',
  'scraping-jobteaser-suivi-offres-stages',
  'scraping-kiwi-extraction-des-donnees-de-voyage',
  'scraping-leboncoin-automatisation-des-actions',
  'scraping-legalstart-suivi-prix-services-juridiques',
  'scraping-legifrance-suivi-textes-lois',
  'scraping-letrot-extraction-des-donnees-de-courses',
  'scraping-linkedin-analyse-donnees',
  'scraping-linkedin-extraction-des-profils-de-personnes',
  'scraping-linkedin-extraction-des-publications-de-profils',
  'scraping-linkedin-extraction-des-reactions-de-publications',
  'scraping-linkedin-recherche-de-profils-en-masse',
  'scraping-linkedin-trouver-des-slugs-d-url-facilement',
  'scraping-loopnet-extraction-des-donnees-immobilieres',
  'scraping-meilleursagents-previsions-marche-immobilier',
  'scraping-meteoagricole-previsions-cultures',
  'scraping-onlyfans-telechargement-de-contenu-multimedia',
  'scraping-ou.sncf-suivi-tarifs-billets-train',
  'scraping-pagesjaunes-extraction-entreprises-locales',
  'scraping-pneu-online-suivi-offres-pneus',
  'scraping-pole-emploi-analyse-demandeurs',
  'scraping-prix-extraction-des-prix-et-disponibilites',
  'scraping-selogerneuf-suivi-nouvelles-constructions',
  'scraping-skyscanner-extraction-des-vols-et-prix',
  'scraping-slack-generation-automatique-de-messages',
  'scraping-snapchat-extraction-des-stories-utilisateurs',
  'scraping-spotify-extraction-des-auditeurs-mensuels',
  'scraping-telegram-ajout-de-membres-a-un-groupe-ou-canal',
  'scraping-telegram-extraction-des-membres-de-groupes',
  'scraping-temu-extraction-des-produits-en-ligne',
  'scraping-tiktok-extraction-rapide-de-profils-gratuits',
  'scraping-twitter-extraction-rapide-des-tweets-et-profils',
  'scraping-url-simple-chargement-et-verification-rapide',
  'scraping-video-telechargement-instantane-de-videos',
  'scraping-vinted-extraction-des-informations-des-vendeurs',
  'scraping-walmart-extraction-des-avis-produits',
  'scraping-zalando-extraction-des-donnees-produits',
  'scraping-zeturf-extraction-des-donnees-de-courses',
])

/**
 * Slugs avec au moins 1 pageview dont le referrer est un moteur de recherche
 * (google / brave / bing / duckduckgo) — signal « ranke » plus fiable que le $direct.
 */
export const CASE_STUDY_SEARCH_REFERRAL_SLUGS = new Set([
  'scraping-telegram-extraction-des-membres-de-groupes',
  'scraping-letrot-extraction-des-donnees-de-courses',
  'scraping-zeturf-extraction-des-donnees-de-courses',
  'scraping-doctolib-suivi-disponibilites-medicales',
  'scraping-fnac-extraction-des-donnees-produits',
  'scraping-instagram-extraction-des-commentaires-gratuits',
  'scraping-onlyfans-telechargement-de-contenu-multimedia',
  'scraping-credit-agricole-offres-bancaires',
  'scraping-jobteaser-extraction-des-offres-d-emploi',
  'scraping-telegram-ajout-de-membres-a-un-groupe-ou-canal',
  'scraping-entreprise-trouver-le-numero-de-telephone',
  'scraping-snapchat-extraction-des-stories-utilisateurs',
  'scraping-instagram-extraction-des-numeros-de-telephone',
  'scraping-meilleursagents-previsions-marche-immobilier',
  'scraping-vinted-extraction-des-informations-des-vendeurs',
  'scraping-facebook-extraction-emails-marketing',
  'scraping-temu-extraction-des-produits-en-ligne',
  'scraping-leboncoin-automatisation-des-actions',
  'scraping-gens-de-confiance-evaluations-services',
  'scraping-legifrance-suivi-textes-lois',
  'scraping-video-telechargement-instantane-de-videos',
  'scraping-facebook-extraction-des-publications-publiques',
  'scraping-facebook-extraction-emails',
  'scraping-tiktok-extraction-rapide-de-profils-gratuits',
  'scraping-skyscanner-extraction-des-vols-et-prix',
  'scraping-apec-suivi-profils-candidats',
  'scraping-twitter-extraction-rapide-des-tweets-et-profils',
  'scraping-facebook-extraction-des-transcriptions-de-videos',
  'scraping-selogerneuf-suivi-nouvelles-constructions',
  'scraping-instagram-transcription-des-videos-reels',
])

export function isSlugTrafficIndexable(slug) {
  if (!slug) return false
  return CASE_STUDY_INDEXABLE_SLUGS.has(slug)
}
