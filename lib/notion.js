import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID
const metricsDatabaseId = process.env.NOTION_METRICS_DATABASE_ID || '2cf36de01fe580d9bdbcc3b781b5c3f7'
const keyResultsDatabaseId = '2cf36de01fe580d9bdbcc3b781b5c3f7'
const meetingsHistoryDatabaseId = '2d236de01fe5813d9c72f6cc6bef03f5'
const abonnesHistoryDatabaseId = '2d236de01fe581a393f1db745b5b9982'
const apifyUsersHistoryDatabaseId = '2d236de01fe581cb9fc0d53f94931a37'

export async function getAllPosts() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    })

    return response.results.map(page => {
      const title = page.properties.Title.title[0]?.plain_text || ''
      const date = page.properties.Date.date?.start
      const tags = page.properties.Tags?.multi_select?.map(tag => tag.name) || []
      const metaDescription = page.properties['Meta Description']?.rich_text[0]?.plain_text || ''
      
      // Générer un slug à partir du titre si le slug n'est pas défini dans Notion
      let slug = page.properties.Slug?.rich_text[0]?.plain_text || ''
      if (!slug && title) {
        slug = title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
          .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
          .replace(/^-+|-+$/g, '') // Supprimer les tirets en début/fin
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
    
    // Ajouter la métrique totale des projets si on a trouvé au moins une des deux missions
    if (totalProjects > 0) {
      let value = totalProjects.toString()
      if (totalProjects >= 1000) {
        value = totalProjects.toLocaleString('fr-FR')
      }
      metrics.push({
        value,
        label: 'projets réalisés',
        source: 'Malt & Fiverr',
        breakdown: maltValue > 0 && fiverrValue > 0 ? { malt: maltValue, fiverr: fiverrValue } : null
      })
    }
    
    // Ordre attendu des métriques sur le site
    const expectedOrder = [
      { label: 'projets réalisés', value: '423', source: 'Malt & Fiverr' },
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
               !nameLower.includes('poids')
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
    console.error('Erreur lors de la récupération des Key Results:', error)
    return []
  }
}

async function getHistoryFromDatabase(databaseId, errorMessage) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: 'Date',
          direction: 'ascending'
        }
      ]
    })

    return response.results.map(page => {
      const date = page.properties.Date?.title?.[0]?.plain_text || ''
      const valeur = page.properties.Valeur?.number || 0
      
      return {
        id: page.id,
        date,
        valeur
      }
    })
  } catch (error) {
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