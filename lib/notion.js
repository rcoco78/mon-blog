import { Client } from '@notionhq/client'
import { siteConfig } from './config'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID
const metricsDatabaseId = process.env.NOTION_METRICS_DATABASE_ID || '2cf36de01fe580d9bdbcc3b781b5c3f7'
const keyResultsDatabaseId = '2cf36de01fe580d9bdbcc3b781b5c3f7'
const meetingsHistoryDatabaseId = '2d236de01fe5813d9c72f6cc6bef03f5'
const abonnesHistoryDatabaseId = '2d236de01fe581a393f1db745b5b9982'
const apifyUsersHistoryDatabaseId = '2d236de01fe581cb9fc0d53f94931a37'
const chessHistoryDatabaseId = process.env.NOTION_CHESS_HISTORY_DATABASE_ID || '2da36de01fe5819aac64fb4db13b7b35'

export async function getAllPosts() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Statut',
        status: {
          equals: 'Publié',
        },
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    })

    return response.results
      .map(page => {
        const title = page.properties.Title.title[0]?.plain_text || ''
        const date = page.properties.Date.date?.start
        const tags = page.properties.Tags?.multi_select?.map(tag => tag.name) || []
        const metaDescription = page.properties['Meta Description']?.rich_text[0]?.plain_text || ''
        
        // Récupérer le slug depuis Notion (propriété "/slug")
        const slug = page.properties['/slug']?.rich_text[0]?.plain_text?.trim() || ''
        
        // Si pas de slug, on ne peut pas continuer (slug obligatoire)
        if (!slug) {
          console.warn(`[getAllPosts] Article sans slug ignoré: ${title} (id: ${page.id})`)
          return null
        }

      // Vérification et formatage de la date
      let formattedDate
      try {
        formattedDate = date ? new Date(date).toISOString() : new Date().toISOString()
      } catch (error) {
        console.error('Erreur de formatage de la date:', error)
        formattedDate = new Date().toISOString()
      }

      return {
        id: page.id,
        title,
        date: formattedDate,
        slug,
        tags,
        metaDescription
      }
      })
      .filter(post => post !== null) // Filtrer les articles sans slug
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error)
    return []
  }
}

export async function getPostBlocks(pageId) {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    })
    return blocks.results
  } catch (error) {
    console.error('Erreur lors de la récupération des blocs:', error)
    return []
  }
}

export async function getPostBySlug(slug) {
  const posts = await getAllPosts()
  const post = posts.find((post) => post.slug === slug)
  if (!post) return null

  const blocks = await getPostBlocks(post.id)
  const metaDescription = post.metaDescription || ''

  // Vérification et formatage de la date
  let formattedDate
  try {
    formattedDate = post.date ? new Date(post.date).toISOString() : new Date().toISOString()
  } catch (error) {
    console.error('Erreur de formatage de la date:', error)
    formattedDate = new Date().toISOString()
  }

  return {
    ...post,
    metaDescription,
    blocks,
    date: formattedDate
  }
}

// Mapping des noms Notion vers les métriques du site
const metricsMapping = {
  'Mission Malt': {
    value: 'currentResult',
    label: 'projets réalisés',
    source: 'sur Malt',
    isTotal: true // Indique qu'on doit additionner avec Mission Fiverr
  },
  'Mission Fiverr': {
    value: 'currentResult',
    label: 'projets réalisés',
    source: 'sur Malt',
    isTotal: true // Indique qu'on doit additionner avec Mission Malt
  },
  'Total users Apify': {
    value: 'currentResult',
    label: 'utilisateurs actifs',
    source: 'de mes scrapers'
  },
  'Total Actors publiés': {
    value: 'currentResult',
    label: 'scrapers publics',
    source: 'sur Apify'
  },
  'Abonnés': {
    value: 'currentResult',
    label: 'abonnés',
    source: 'Logement Atypique'
  },
  'Vidéos publiées': {
    value: 'currentResult',
    label: 'vidéos publiées',
    source: 'Logement Atypique'
  }
}

export async function getMetrics() {
  try {
    const response = await notion.databases.query({
      database_id: metricsDatabaseId,
    })

    const metrics = []
    let totalProjects = 0 // Pour additionner Malt + Fiverr
    let maltValue = 0
    let fiverrValue = 0
    
    for (const page of response.results) {
      const name = page.properties.Name?.title?.[0]?.plain_text || ''
      const currentResult = page.properties['Current result']?.number || 0
      
      // Chercher dans le mapping
      const mapping = metricsMapping[name]
      
      if (mapping) {
        // Si c'est une métrique de total (Malt ou Fiverr), on additionne
        if (mapping.isTotal) {
          totalProjects += currentResult
          // Stocker les valeurs individuelles
          if (name === 'Mission Malt') {
            maltValue = currentResult
          } else if (name === 'Mission Fiverr') {
            fiverrValue = currentResult
          }
        } else {
          // Pour les autres métriques
          let value = currentResult.toString()
          
          if (currentResult >= 1000) {
            // Formater les grands nombres avec des espaces
            value = currentResult.toLocaleString('fr-FR')
          }
          
          metrics.push({
            value,
            label: mapping.label,
            source: mapping.source
          })
        }
      }
    }
    
    // Ajouter la métrique totale des projets — Malt aligné sur le profil public
    const maltPublic = siteConfig.socialProof?.malt?.projects || 183
    if (totalProjects > 0 || maltValue > 0 || fiverrValue > 0) {
      const malt = maltPublic
      const fiverr = fiverrValue > 0 ? fiverrValue : 0
      const total = malt + fiverr
      let value = total.toString()
      if (total >= 1000) {
        value = total.toLocaleString('fr-FR')
      }
      metrics.push({
        value,
        label: 'projets réalisés',
        source: fiverr > 0 ? 'Malt & Fiverr' : 'sur Malt',
        href: siteConfig.social.malt,
        breakdown: fiverr > 0 ? { malt, fiverr } : null,
      })
    }
    
    // Ordre attendu des métriques sur le site (fallback = profil Malt public)
    const maltProjects = siteConfig.socialProof?.malt?.projects || 183
    const expectedOrder = [
      { label: 'projets réalisés', value: String(maltProjects), source: 'sur Malt', href: siteConfig.social.malt },
      { label: 'scrapers publics', value: '20', source: 'sur Apify' },
      { label: 'utilisateurs actifs', value: '154', source: 'de mes scrapers' },
      { label: 'abonnés', value: '242', source: 'Logement Atypique' }
    ]
    
    // Créer un map des métriques trouvées par label
    const metricsMap = new Map()
    metrics.forEach(m => {
      metricsMap.set(m.label, m)
    })
    
    // Construire le tableau final dans l'ordre attendu
    const finalMetrics = expectedOrder.map(expected => {
      const found = metricsMap.get(expected.label)
      if (found) {
        return found
      }
      // Utiliser la valeur par défaut si non trouvée
      return {
        value: expected.value,
        label: expected.label,
        source: expected.source
      }
    })
    
    return finalMetrics
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error)
    return []
  }
}

export async function getKeyResults() {
  try {
    const response = await notion.databases.query({
      database_id: keyResultsDatabaseId,
      sorts: [
        {
          property: 'Status',
          direction: 'descending'
        }
      ]
    })

    // Récupérer tous les parents pour obtenir leurs noms
    const parentIds = new Set()
    response.results.forEach(page => {
      const parentId = page.properties['Parent item']?.relation?.[0]?.id
      if (parentId) {
        parentIds.add(parentId)
      }
    })

    // Récupérer les noms des parents
    const parentNames = new Map()
    if (parentIds.size > 0) {
      const parentPages = await Promise.all(
        Array.from(parentIds).map(id => 
          notion.pages.retrieve({ page_id: id }).catch(() => null)
        )
      )
      parentPages.forEach(page => {
        if (page) {
          const parentName = page.properties?.Name?.title?.[0]?.plain_text || 'Sans catégorie'
          parentNames.set(page.id, parentName)
        }
      })
    }

    return response.results
      .filter(page => {
        const name = page.properties.Name?.title?.[0]?.plain_text || ''
        const nameLower = name.toLowerCase()
        // Exclure tous les Key Results contenant certains mots-clés privés
        return !nameLower.includes('patrimoine') && 
               !nameLower.includes('nuit') && 
               !nameLower.includes('sommeil') &&
               !nameLower.includes('poids') &&
               !nameLower.includes('datareacher')
      })
      .map(page => {
        const name = page.properties.Name?.title?.[0]?.plain_text || ''
        const status = page.properties.Status?.status?.name || 'Not started'
        const currentResult = page.properties['Current result']?.number || 0
        const targetResult = page.properties['Target result']?.number || 0
        // Calculer le reste (positif) ou le dépassement (négatif)
        const remaining = targetResult > 0 ? (targetResult - currentResult) : 0
        // Ne pas limiter à 100% pour détecter les dépassements d'objectif
        const progress = targetResult > 0 ? (currentResult / targetResult) * 100 : 0
        
        // Récupérer le parent item et son nom
        const parentItemId = page.properties['Parent item']?.relation?.[0]?.id || null
        const category = parentItemId ? (parentNames.get(parentItemId) || 'Sans catégorie') : 'Sans catégorie'
        
        // Exclure les Key Results sans catégorie (ce sont les grandes catégories parentes)
        if (category === 'Sans catégorie' || !parentItemId) {
          return null
        }
        
        // Exclure toutes les catégories liées aux finances (insensible à la casse et aux variantes)
        const categoryLower = category.toLowerCase()
        if (categoryLower.includes('finance') || categoryLower.includes('finances')) {
          return null
        }
        
        return {
          id: page.id,
          name,
          status,
          currentResult,
          targetResult,
          remaining,
          progress: Math.round(progress * 10) / 10, // Arrondir à 1 décimale
          parentItem: parentItemId,
          category
        }
      })
      .filter(item => item !== null) // Filtrer les éléments null
  } catch (error) {
    // Si c'est un rate limit, logger un avertissement mais retourner un tableau vide
    const isRateLimit = error.message?.includes('rate_limited') || 
                       error.message?.includes('429') || 
                       error.status === 429 ||
                       error.code === 'rate_limited' ||
                       error.code === 'rate_limit_exceeded'
    
    if (isRateLimit) {
      console.warn('⚠️ Rate limit Notion détecté lors de la récupération des Key Results')
      return []
    }
    console.error('Erreur lors de la récupération des Key Results:', error)
    return []
  }
}

function readHistoryValue(prop) {
  if (!prop) return 0
  if (prop.type === 'number' && typeof prop.number === 'number') return prop.number
  if (prop.type === 'formula' && prop.formula?.type === 'number' && typeof prop.formula.number === 'number') {
    return prop.formula.number
  }
  return 0
}

function readHistoryDate(prop) {
  if (!prop) return ''
  if (prop.type === 'title') return prop.title?.[0]?.plain_text || ''
  if (prop.type === 'rich_text') return prop.rich_text?.map((t) => t.plain_text).join('') || ''
  if (prop.type === 'date' && prop.date?.start) return prop.date.start
  return ''
}

async function getHistoryFromDatabase(databaseId, errorMessage) {
  try {
    // L’API Notion ne renvoie que 100 entrées par page : sans pagination, on ne voyait
    // qu’un sous-ensemble (souvent les plus anciennes) et les graphiques semblaient « figés ».
    const collected = []
    let cursor = undefined
    do {
      const response = await notion.databases.query({
        database_id: databaseId,
        sorts: [
          {
            property: 'Date',
            direction: 'ascending'
          }
        ],
        page_size: 100,
        start_cursor: cursor
      })
      collected.push(...response.results)
      cursor = response.has_more ? response.next_cursor : undefined
    } while (cursor)

    return collected.map((page) => {
      const date = readHistoryDate(page.properties.Date)
      const valeur = readHistoryValue(page.properties.Valeur)

      return {
        id: page.id,
        date,
        valeur
      }
    })
  } catch (error) {
    // Si c'est un rate limit, logger un avertissement mais retourner un tableau vide
    const isRateLimit = error.message?.includes('rate_limited') || 
                       error.message?.includes('429') || 
                       error.status === 429 ||
                       error.code === 'rate_limited' ||
                       error.code === 'rate_limit_exceeded'
    
    if (isRateLimit) {
      console.warn(`⚠️ Rate limit Notion détecté: ${errorMessage}`)
      return []
    }
    console.error(errorMessage, error)
    return []
  }
}

export async function getMeetingsHistory() {
  return getHistoryFromDatabase(
    meetingsHistoryDatabaseId,
    'Erreur lors de la récupération de l\'historique des meetings:'
  )
}

export async function getAbonnesHistory() {
  return getHistoryFromDatabase(
    abonnesHistoryDatabaseId,
    'Erreur lors de la récupération de l\'historique des abonnés:'
  )
}

export async function getApifyUsersHistory() {
  return getHistoryFromDatabase(
    apifyUsersHistoryDatabaseId,
    'Erreur lors de la récupération de l\'historique des utilisateurs Apify:'
  )
}

export async function getChessHistory() {
  return getHistoryFromDatabase(
    chessHistoryDatabaseId,
    'Erreur lors de la récupération de l\'historique Chess.com:'
  )
}

// Récupérer l'historique d'un Key Result spécifique depuis son dashboard Notion
// L'historique est stocké dans une base de données liée au Key Result via une relation ou comme page enfant
export async function getKeyResultHistory(keyResultId, days = 30) {
  try {
    // Récupérer le Key Result pour obtenir ses propriétés
    const keyResult = await notion.pages.retrieve({ page_id: keyResultId })
    
    // Chercher toutes les propriétés de type relation qui pourraient pointer vers une base de données d'historique
    const allProperties = Object.keys(keyResult.properties || {})
    let historyDatabaseId = null
    
    // 1. Chercher une relation vers une base de données d'historique dans les propriétés
    for (const propName of allProperties) {
      const prop = keyResult.properties[propName]
      if (prop?.type === 'relation' && prop.relation && prop.relation.length > 0) {
        // Vérifier si c'est une relation vers une base de données
        try {
          const relatedPage = await notion.pages.retrieve({ page_id: prop.relation[0].id })
          // Si la page liée est une base de données, utiliser son ID
          if (relatedPage.object === 'database') {
            historyDatabaseId = prop.relation[0].id
            break
          }
        } catch (err) {
          // Continuer avec la propriété suivante
          continue
        }
      }
    }
    
    // 2. Si pas trouvé, chercher dans les pages enfants (les tableaux d'historique sont souvent des bases de données enfants)
    if (!historyDatabaseId) {
      try {
        const children = await notion.blocks.children.list({
          block_id: keyResultId,
          page_size: 100
        })
        
        // Chercher parmi les enfants qui sont des bases de données
        for (const child of children.results) {
          if (child.type === 'child_database' || child.type === 'database') {
            // Vérifier si cette base de données contient des propriétés Date et Valeur
            try {
              const dbInfo = await notion.databases.retrieve({ database_id: child.id })
              const hasDate = Object.values(dbInfo.properties).some(prop => 
                prop.type === 'date' || (prop.type === 'title' && prop.name.toLowerCase().includes('date'))
              )
              const hasValue = Object.values(dbInfo.properties).some(prop => 
                prop.type === 'number' && (prop.name.toLowerCase().includes('valeur') || prop.name.toLowerCase().includes('value'))
              )
              
              if (hasDate && hasValue) {
                historyDatabaseId = child.id
                break
              }
            } catch (err) {
              continue
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la recherche dans les pages enfants:', err)
      }
    }
    
    // Si pas de relation directe, chercher dans les bases de données d'historique existantes
    // en filtrant par relation vers le Key Result
    if (!historyDatabaseId) {
      const historyDatabases = [
        meetingsHistoryDatabaseId,
        abonnesHistoryDatabaseId,
        apifyUsersHistoryDatabaseId,
        chessHistoryDatabaseId
      ]
      
      // Essayer chaque base de données d'historique
      for (const dbId of historyDatabases) {
        try {
          // D'abord, récupérer le schéma de la base de données pour trouver la propriété de relation
          const dbInfo = await notion.databases.retrieve({ database_id: dbId })
          const relationProperty = Object.values(dbInfo.properties).find(
            prop => prop.type === 'relation'
          )
          
          if (relationProperty) {
            const response = await notion.databases.query({
              database_id: dbId,
              filter: {
                property: relationProperty.name,
                relation: {
                  contains: keyResultId
                }
              },
              sorts: [
                {
                  property: 'Date',
                  direction: 'descending'
                }
              ]
            })
            
            if (response.results.length > 0) {
              historyDatabaseId = dbId
              break
            }
          }
        } catch (err) {
          // Continuer avec la base de données suivante
          continue
        }
      }
    }
    
    if (!historyDatabaseId) {
      return []
    }
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    // Récupérer le schéma pour trouver les propriétés Date et Valeur
    const dbInfo = await notion.databases.retrieve({ database_id: historyDatabaseId })
    const dateProperty = Object.values(dbInfo.properties).find(
      prop => prop.type === 'title' && prop.name.toLowerCase().includes('date')
    ) || Object.values(dbInfo.properties).find(prop => prop.type === 'date')
    
    const valueProperty = Object.values(dbInfo.properties).find(
      prop => prop.type === 'number' && (prop.name.toLowerCase().includes('valeur') || prop.name.toLowerCase().includes('value'))
    ) || Object.values(dbInfo.properties).find(prop => prop.type === 'number')
    
    // Construire le filtre de date
    let dateFilter = {}
    if (dateProperty) {
      if (dateProperty.type === 'date') {
        dateFilter = {
          property: dateProperty.name,
          date: {
            on_or_after: cutoffDate.toISOString().split('T')[0]
          }
        }
      }
    }
    
    // Construire le filtre pour inclure la relation vers le Key Result si nécessaire
    let finalFilter = dateProperty && dateProperty.type === 'date' ? dateFilter : undefined
    
    // Vérifier si la base de données a une propriété de relation vers le Key Result
    const relationProperty = Object.values(dbInfo.properties).find(
      prop => prop.type === 'relation'
    )
    
    if (relationProperty) {
      // Ajouter le filtre de relation si on n'a pas déjà trouvé via une relation directe
      const relationFilter = {
        property: relationProperty.name,
        relation: {
          contains: keyResultId
        }
      }
      
      if (finalFilter) {
        finalFilter = {
          and: [dateFilter, relationFilter]
        }
      } else {
        finalFilter = relationFilter
      }
    }
    
    const response = await notion.databases.query({
      database_id: historyDatabaseId,
      filter: finalFilter,
      sorts: dateProperty ? [
        {
          property: dateProperty.name,
          direction: 'ascending'
        }
      ] : []
    })
    
    const history = response.results
      .map(page => {
        // Extraire la date
        let dateStr = null
        if (dateProperty) {
          if (dateProperty.type === 'title') {
            dateStr = page.properties[dateProperty.name]?.title?.[0]?.plain_text
          } else if (dateProperty.type === 'date') {
            dateStr = page.properties[dateProperty.name]?.date?.start
          }
        }
        if (!dateStr) {
          dateStr = page.created_time
        }
        
        // Extraire la valeur
        const valeur = valueProperty 
          ? (page.properties[valueProperty.name]?.number || 0)
          : (page.properties.Valeur?.number || 
             page.properties.Value?.number ||
             page.properties['Current result']?.number || 0)
        
        let date
        try {
          if (dateStr) {
            date = new Date(dateStr)
          } else {
            date = new Date(page.created_time)
          }
        } catch {
          date = new Date(page.created_time)
        }
        
        return {
          id: page.id,
          date: date.toISOString(),
          valeur,
          timestamp: date.getTime()
        }
      })
      .filter(item => item.timestamp >= cutoffDate.getTime())
      .sort((a, b) => a.timestamp - b.timestamp)
    
    console.log(`✅ Historique récupéré pour Key Result ${keyResultId}: ${history.length} entrées sur ${days} jours (base de données: ${historyDatabaseId})`)
    if (history.length > 0) {
      console.log(`   Première valeur: ${history[0].valeur} le ${history[0].date}`)
      console.log(`   Dernière valeur: ${history[history.length - 1].valeur} le ${history[history.length - 1].date}`)
    }
    return history
    
  } catch (error) {
    // Si c'est un rate limit, logger un avertissement mais retourner un tableau vide
    const isRateLimit = error.message?.includes('rate_limited') || 
                       error.message?.includes('429') || 
                       error.status === 429 ||
                       error.code === 'rate_limited' ||
                       error.code === 'rate_limit_exceeded'
    
    if (isRateLimit) {
      console.warn(`⚠️ Rate limit Notion détecté pour Key Result ${keyResultId}, retour d'un historique vide`)
      return []
    }
    console.error(`❌ Erreur lors de la récupération de l'historique pour le Key Result ${keyResultId}:`, error)
    console.error(`   Détails:`, error.message)
    return []
  }
} 