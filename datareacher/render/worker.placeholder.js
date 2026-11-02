/**
 * Worker Render — exécute les scrapers Datareacher.
 * Branche RENDER_WORKER_URL sur le site. Aucun Apify.
 *
 * Contrat attendu :
 *   POST /run
 *   { "slug": "airbnb-hosts", "input": "Paris", "limit": 20 }
 *   → { "rows": [ { ... } ] }
 */

export default {
  name: 'datareacher-worker',
  envVar: 'RENDER_WORKER_URL',
}
