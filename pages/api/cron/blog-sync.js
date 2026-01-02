// Cron job pour synchroniser la liste des articles depuis Notion vers Blob Storage
// Exécuté toutes les heures pour garder la liste à jour

import { Client } from '@notionhq/client'
import { put } from '@vercel/blob'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID
const BLOB_FILENAME = 'blog-posts.json'

async function fetchAndSavePosts() {
  let allPosts = []
  let hasMore = true
  let startCursor = undefined

  // Récupérer uniquement les articles avec le statut "Publié"
  while (hasMore) {
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
          direction: 'descending',
        },
      ],
      page_size: 100,
      start_cursor: startCursor,
    })

    allPosts = allPosts.concat(response.results)
    hasMore = response.has_more
    startCursor = response.next_cursor

    console.log(`[blog-sync] Récupéré ${response.results.length} articles (total: ${allPosts.length})`)
  }

  // Transformer les articles
  const posts = allPosts.map((page) => {
    const title = page.properties.Title?.title?.[0]?.plain_text?.trim() || ''
    const date = page.properties.Date?.date?.start || ''
    const tags = page.properties.Tags?.multi_select?.map((tag) => tag.name.trim()) || []
    const metaDescription = page.properties['Meta Description']?.rich_text?.[0]?.plain_text?.trim() || ''

    // Générer un slug à partir du titre si le slug n'est pas défini dans Notion
    let slug = page.properties.Slug?.rich_text?.[0]?.plain_text?.trim() || ''
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
      metaDescription,
      url: page.url,
      coverImage: page.cover
        ? page.cover.type === 'external'
          ? page.cover.external.url
          : page.cover.file.url
        : null,
      lastEdited: page.last_edited_time,
    }
  })

  // Sauvegarder dans Blob Storage
  await put(
    BLOB_FILENAME,
    JSON.stringify(
      {
        posts,
        lastUpdated: new Date().toISOString(),
      },
      null,
      2
    ),
    { access: 'public', allowOverwrite: true }
  )

  console.log(`[blog-sync] Liste des articles sauvegardée. Nombre d'articles : ${posts.length}`)
  return posts.length
}

export default async function handler(req, res) {
  // Sécurité : vérifier le secret si configuré
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const count = await fetchAndSavePosts()
    res.status(200).json({ ok: true, count, lastUpdated: new Date().toISOString() })
  } catch (error) {
    console.error('[blog-sync] Erreur:', error)
    res.status(500).json({ error: error.message })
  }
}

