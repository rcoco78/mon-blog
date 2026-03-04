/**
 * Système de gestion des actors Apify enrichis
 * Les données sont stockées dans Blob Storage et synchronisées automatiquement via cron job
 * Enrichies avec GPT-4o mini pour générer descriptions, cas d'usage, etc.
 */

const BLOB_FILENAME = 'apify-actors.json'
let cachedActors = null

// Charger tous les actors enrichis (depuis Blob Storage avec fallback local)
export async function getAllEnrichedActors() {
  // Fonction uniquement disponible côté serveur
  if (typeof window !== 'undefined') {
    return []
  }
  
  // Essayer Blob Storage avec timeout pour éviter de bloquer trop longtemps
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob')
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout Blob Storage')), 5000)
      )
      
      const blobPromise = (async () => {
        const blobs = await list({ prefix: BLOB_FILENAME })
        const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

        if (existingBlob) {
          const response = await fetch(existingBlob.url, { next: { revalidate: 300 } })

          if (response.ok) {
            const data = await response.json()
            if (data.actors && Array.isArray(data.actors)) {
              if (data.actors.length > 0) {
                cachedActors = data.actors
                return data.actors
              } else {
                throw new Error('Blob Storage vide')
              }
            }
            throw new Error('Format Blob Storage inconnu')
          }
        }
        throw new Error('Blob Storage vide ou invalide')
      })()
      
      const actors = await Promise.race([blobPromise, timeoutPromise])
      return actors
    } catch (error) {
      if (error.message !== 'Timeout Blob Storage' && error.message !== 'Blob Storage vide') {
        console.warn('⚠️ Erreur Blob Storage, fallback fichier local:', error.message)
      }
    }
  }

  // Fallback vers fichier local (uniquement en développement/localhost)
  if (!process.env.VERCEL) {
    const fs = typeof window === 'undefined' ? require('fs') : null
    const path = typeof window === 'undefined' ? require('path') : null
    
    if (fs && path) {
      const ACTORS_FILE = path.join(process.cwd(), 'data', 'apify-actors.json')
      try {
        if (fs.existsSync(ACTORS_FILE)) {
          const data = JSON.parse(fs.readFileSync(ACTORS_FILE, 'utf8'))
          if (data.actors && Array.isArray(data.actors)) {
            cachedActors = data.actors
            return data.actors
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement fichier local:', error.message)
      }
    }
  }
  
  return []
}

// Obtenir un actor par slug
export async function getActorBySlug(slug) {
  const actors = await getAllEnrichedActors()
  return actors.find(actor => (actor.slug || actor.name) === slug)
}

function isValidSlug(s) {
  if (!s || typeof s !== 'string') return false
  const t = s.trim()
  return t.length > 0 && !/[\[\]{}]/.test(t) && !['[slug]', '[category]', '[id]'].includes(t)
}

// Exporter pour compatibilité avec tools.js
export async function getEnrichedActorsAsTools() {
  const actors = await getAllEnrichedActors()
  
  if (!actors || actors.length === 0) return []

  return actors
    .filter(actor => isValidSlug(actor.slug || actor.name))
    .map(actor => {
      const enriched = actor.enrichedData || {}
      const slug = (actor.slug || actor.name).trim()
      return {
        slug,
        name: actor.title || actor.name,
        description: actor.description || '',
        category: enriched.category || 'Scraping & Automatisation',
        type: 'tool',
        iconSvg: 'search',
        link: `/marketplace/outils/${slug}`,
      isPaid: false,
      price: 0,
      isNew: false,
      date: actor.lastEnriched 
        ? actor.lastEnriched.split('T')[0]
        : (actor.createdAt ? new Date(actor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      lastEnriched: actor.lastEnriched || null,
      // Métadonnées spécifiques Apify (utiliser null au lieu de undefined)
      apifyActorId: actor.id || null,
      apifyUsername: actor.username || null,
      apifyUrl: actor.url || null,
      apifyStats: actor.stats || null,
      apifyInputSchema: actor.inputSchema || null,
      apifyDefaultRunInput: actor.defaultRunInput || null,
      // Données enrichies
      enrichedData: enriched || null
    }
  })
}
