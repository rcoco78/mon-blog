import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID
const metricsDatabaseId = process.env.NOTION_METRICS_DATABASE_ID || '2cf36de01fe580d9bdbcc3b781b5c3f7'

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
    
    for (const page of response.results) {
      const name = page.properties.Name?.title?.[0]?.plain_text || ''
      const currentResult = page.properties['Current result']?.number || 0
      
      // Chercher dans le mapping
      const mapping = metricsMapping[name]
      
      if (mapping) {
        // Si c'est une métrique de total (Malt ou Fiverr), on additionne
        if (mapping.isTotal) {
          totalProjects += currentResult
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
        source: 'Malt & Fiverr'
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