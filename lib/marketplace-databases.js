/**
 * Système de gestion des bases de données marketplace
 * Les données sont stockées dans un fichier JSON local ET synchronisées vers Blob Storage
 * Générées dynamiquement à partir des Google Sheets dans le Drive
 * 
 * NOTE: Ce fichier ne doit être utilisé QUE côté serveur (getStaticProps, getStaticPaths, API routes)
 */

import path from 'path'

// Utiliser require() pour fs afin d'éviter le bundling côté client
const fs = typeof window === 'undefined' ? require('fs') : null

const DATABASES_FILE = typeof window === 'undefined' 
  ? path.join(process.cwd(), 'data', 'marketplace-databases.json')
  : null

const BLOB_FILENAME = 'marketplace-databases.json'
let cachedDatabases = null

// Structure d'une base de données enrichie
/**
 * @typedef {Object} MarketplaceDatabase
 * @property {string} sheetId - ID du Google Sheet
 * @property {string} name - Nom de la base de données
 * @property {string} slug - Slug pour l'URL
 * @property {string} description - Description enrichie (générée par GPT)
 * @property {string} category - Catégorie (Finance, Artisanat, etc.)
 * @property {number} price - Prix en euros
 * @property {boolean} isPaid - Si payant ou gratuit
 * @property {number} rowCount - Nombre de lignes
 * @property {string[]} headers - Colonnes disponibles
 * @property {string} sheetUrl - URL du Google Sheet
 * @property {Object} enrichedData - Données enrichies par GPT
 * @property {string} enrichedData.companyInfo - Infos sur l'entreprise (si applicable)
 * @property {string[]} enrichedData.useCases - Cas d'usage
 * @property {string[]} enrichedData.problem - Problèmes résolus
 * @property {string[]} enrichedData.solution - Solutions apportées
 * @property {string[]} enrichedData.keywords - Mots-clés SEO
 * @property {string} date - Date de création/mise à jour
 * @property {string} lastEnriched - Dernière fois enrichi
 */

// Charger toutes les bases de données (depuis Blob Storage avec fallback local)
export async function getAllDatabases() {
  // Fonction uniquement disponible côté serveur
  if (typeof window !== 'undefined' || !fs || !DATABASES_FILE) {
    return []
  }
  
  // Ne pas utiliser le cache pour forcer le rechargement depuis Blob Storage
  // Le cache peut être obsolète si les données ont été mises à jour après le build
  // On recharge toujours depuis Blob Storage pour avoir les données les plus récentes
  
  // Essayer Blob Storage avec timeout pour éviter de bloquer trop longtemps
  // Vérifier si le token est disponible (en prod ou localhost avec token configuré)
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
          const response = await fetch(existingBlob.url, {
            method: 'GET',
            cache: 'no-store',
          })

          if (response.ok) {
            const data = await response.json()
            if (data.databases && Array.isArray(data.databases)) {
              console.log(`✅ ${data.databases.length} base(s) de données chargée(s) depuis Blob Storage`)
              cachedDatabases = data.databases
              return data.databases
            }
            // Format ancien (tableau direct)
            if (Array.isArray(data)) {
              console.log(`✅ ${data.length} base(s) de données chargée(s) depuis Blob Storage (format ancien)`)
              cachedDatabases = data
              return data
            }
          }
        }
        throw new Error('Blob Storage vide ou invalide')
      })()
      
      const databases = await Promise.race([blobPromise, timeoutPromise])
      return databases
    } catch (error) {
      // Logger l'erreur pour debug
      if (error.message !== 'Timeout Blob Storage') {
        console.warn('⚠️ Erreur lors de la récupération depuis Blob Storage, fallback vers fichier local:', error.message)
      } else {
        console.warn('⚠️ Timeout Blob Storage (>5s), fallback vers fichier local')
      }
    }
  } else {
    console.log('ℹ️  BLOB_READ_WRITE_TOKEN non configuré, chargement depuis fichier local uniquement')
  }

  // Fallback vers fichier local (toujours disponible)
  try {
    if (fs.existsSync(DATABASES_FILE)) {
      const data = fs.readFileSync(DATABASES_FILE, 'utf8')
      const parsed = JSON.parse(data)
      // Si c'est un tableau directement, le retourner
      if (Array.isArray(parsed)) {
        console.log(`✅ ${parsed.length} base(s) de données chargée(s) depuis fichier local`)
        cachedDatabases = parsed
        return parsed
      }
      // Si c'est un objet avec une propriété databases
      if (parsed.databases && Array.isArray(parsed.databases)) {
        console.log(`✅ ${parsed.databases.length} base(s) de données chargée(s) depuis fichier local`)
        cachedDatabases = parsed.databases
        return parsed.databases
      }
    } else {
      console.warn(`⚠️  Fichier local ${DATABASES_FILE} n'existe pas`)
    }
    console.warn('⚠️  Aucune base de données trouvée (ni Blob Storage ni fichier local)')
    return []
  } catch (error) {
    console.error('❌ Erreur lors du chargement des bases de données depuis fichier local:', error.message)
    return []
  }
}

// Version synchrone pour compatibilité (utilise le cache ou le fichier local)
export function getAllDatabasesSync() {
  if (typeof window !== 'undefined' || !fs || !DATABASES_FILE) {
    return []
  }
  
  // Utiliser le cache si disponible
  if (cachedDatabases) {
    return cachedDatabases
  }
  
  // Sinon, charger depuis le fichier local
  try {
    if (fs.existsSync(DATABASES_FILE)) {
      const data = fs.readFileSync(DATABASES_FILE, 'utf8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        cachedDatabases = parsed
        return parsed
      }
      if (parsed.databases && Array.isArray(parsed.databases)) {
        cachedDatabases = parsed.databases
        return parsed.databases
      }
    }
    return []
  } catch (error) {
    console.error('Erreur lors du chargement des bases de données:', error)
    return []
  }
}

// Sauvegarder les bases de données
export function saveDatabases(databases) {
  // Fonction uniquement disponible côté serveur
  if (typeof window !== 'undefined' || !fs || !DATABASES_FILE) {
    return false
  }
  
  try {
    const dir = path.dirname(DATABASES_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(DATABASES_FILE, JSON.stringify(databases, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des bases de données:', error)
    return false
  }
}

// Obtenir une base de données par slug
export async function getDatabaseBySlug(slug) {
  const databases = await getAllDatabases()
  return databases.find(db => db.slug === slug)
}

// Obtenir une base de données par sheetId
export async function getDatabaseBySheetId(sheetId) {
  const databases = await getAllDatabases()
  return databases.find(db => db.sheetId === sheetId)
}

// Ajouter ou mettre à jour une base de données
export function upsertDatabase(database) {
  const databases = getAllDatabasesSync()
  const existingIndex = databases.findIndex(db => db.sheetId === database.sheetId)
  
  if (existingIndex >= 0) {
    // Mettre à jour
    databases[existingIndex] = {
      ...databases[existingIndex],
      ...database,
      lastEnriched: new Date().toISOString()
    }
  } else {
    // Ajouter
    databases.push({
      ...database,
      date: new Date().toISOString().split('T')[0],
      lastEnriched: new Date().toISOString()
    })
  }
  
  // Invalider le cache
  cachedDatabases = null
  
  return saveDatabases(databases)
}

// Obtenir les bases de données par catégorie
export async function getDatabasesByCategory(category) {
  const databases = await getAllDatabases()
  return databases.filter(db => db.category === category)
}

// Obtenir les bases de données récentes
export async function getRecentDatabases(count = 5) {
  const databases = await getAllDatabases()
  return databases
    .sort((a, b) => {
      const dateA = new Date(a.date || 0)
      const dateB = new Date(b.date || 0)
      return dateB - dateA
    })
    .slice(0, count)
}

// Obtenir les bases de données similaires (même catégorie)
export async function getRelatedDatabases(slug, count = 3) {
  const current = await getDatabaseBySlug(slug)
  if (!current) return []
  
  const databases = await getAllDatabases()
  return databases
    .filter(db => db.slug !== slug && db.category === current.category)
    .slice(0, count)
}

// Exporter pour compatibilité avec tools.js (version async pour charger depuis Blob Storage)
export async function getDatabasesAsTools() {
  const databases = await getAllDatabases()
  return databases.map(db => ({
    name: db.name, // Le nom dans le JSON est déjà complet
    description: db.description,
    category: db.category,
    type: 'database',
    iconSvg: 'search',
    link: `/marketplace/${db.slug}`,
    isPaid: db.isPaid,
    price: db.isPaid ? db.price : undefined,
    isNew: true,
    date: db.date
  }))
}

