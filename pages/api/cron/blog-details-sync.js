// Cron job pour synchroniser les détails complets des articles avec conversion markdown
// Traite les 10 derniers articles publiés pour éviter les rate limits

import { Client } from '@notionhq/client'
import { put, list } from '@vercel/blob'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID

async function getFullPost(post) {
  try {
    console.log(`[blog-details-sync] Récupération de l'article id=${post.id}, slug=${post.slug}`)

    // Récupérer les blocs de la page
    const blocks = await notion.blocks.children.list({
      block_id: post.id,
      page_size: 100,
    })

    // Convertir en markdown avec notion-to-md
    // Utiliser require() pour éviter les problèmes d'import ES6 dans l'environnement de build
    const notionToMd = require('notion-to-md')
    // La version alpha utilise NotionConverter au lieu de NotionToMarkdown
    const NotionConverterClass = notionToMd.default || notionToMd.NotionConverter || notionToMd.NotionToMarkdown || notionToMd
    
    if (typeof NotionConverterClass !== 'function') {
      console.error('[blog-details-sync] NotionConverter n\'est pas un constructeur:', typeof NotionConverterClass, Object.keys(notionToMd))
      throw new Error('NotionConverter n\'est pas un constructeur valide')
    }

    const n2m = new NotionConverterClass({ notionClient: notion })
    const mdBlocks = await n2m.pageToMarkdown(post.id)
    const mdString = n2m.toMarkdownString(mdBlocks)

    return {
      ...post,
      contentMarkdown: mdString,
      blocks: blocks.results,
    }
  } catch (error) {
    console.error(`[blog-details-sync] Erreur pour l'article id=${post.id}, slug=${post.slug} :`, error)
    throw error
  }
}

async function fetchAndSavePostDetails() {
  try {
    console.log('[blog-details-sync] Récupération des articles depuis Blob Storage...')

    // Récupérer la liste des articles depuis Blob Storage
    const blobs = await list({ prefix: 'blog-posts.json' })
    const existingBlob = blobs.blobs.find((blob) => blob.pathname === 'blog-posts.json')

    if (!existingBlob) {
      console.log('[blog-details-sync] Aucune liste d\'articles trouvée, on récupère depuis Notion...')
      // Fallback : récupérer depuis Notion directement (uniquement les articles publiés)
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
        page_size: 10,
      })

      const posts = response.results
        .map((page) => {
          const title = page.properties.Title?.title?.[0]?.plain_text?.trim() || ''
          // Récupérer le slug depuis Notion (propriété "/slug")
          const slug = page.properties['/slug']?.rich_text?.[0]?.plain_text?.trim() || ''
          
          // Si pas de slug, on ne peut pas continuer (slug obligatoire)
          if (!slug) {
            console.warn(`[blog-details-sync] Article sans slug ignoré: ${title} (id: ${page.id})`)
            return null
          }

          return {
            id: page.id,
            title,
            slug,
            date: page.properties.Date?.date?.start || new Date().toISOString(),
          }
        })
        .filter(post => post !== null) // Filtrer les articles sans slug

      // Traiter les 10 derniers articles
      const postsToProcess = posts.slice(0, 10)
      console.log(`[blog-details-sync] Traitement des ${postsToProcess.length} derniers articles`)

      let successCount = 0
      let errorCount = 0

      for (const post of postsToProcess) {
        try {
          console.log(`[blog-details-sync] Début traitement : ${post.slug}`)
          const fullPost = await getFullPost(post)
          await put(
            `blog-posts/${post.slug}.json`,
            JSON.stringify(fullPost, null, 2),
            { access: 'public', allowOverwrite: true }
          )
          console.log(`[blog-details-sync] Article détaillé sauvegardé : ${post.slug}`)
          successCount++
        } catch (error) {
          console.error(`[blog-details-sync] Erreur pour l'article ${post.slug} :`, error)
          errorCount++
        }
      }

      console.log(`[blog-details-sync] Traitement terminé : ${successCount} succès, ${errorCount} erreurs`)
      return { total: postsToProcess.length, success: successCount, errors: errorCount }
    }

    // Récupérer la liste depuis Blob Storage
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    })

    if (!response.ok) {
      throw new Error(`Erreur récupération liste articles: ${response.status}`)
    }

    const data = await response.json()
    const allPosts = data.posts || []

    // Traiter les 10 derniers articles publiés
    const postsToProcess = allPosts.slice(0, 10)
    console.log(`[blog-details-sync] Traitement des ${postsToProcess.length} derniers articles publiés`)

    // Log des articles à traiter
    postsToProcess.forEach((post, index) => {
      console.log(`[blog-details-sync] ${index + 1}. ${post.slug} (${post.date})`)
    })

    // Traiter chaque article individuellement
    let successCount = 0
    let errorCount = 0

    for (const post of postsToProcess) {
      try {
        console.log(`[blog-details-sync] Début traitement : ${post.slug}`)
        const fullPost = await getFullPost(post)
        await put(
          `blog-posts/${post.slug}.json`,
          JSON.stringify(fullPost, null, 2),
          { access: 'public', allowOverwrite: true }
        )
        console.log(`[blog-details-sync] Article détaillé sauvegardé : ${post.slug}`)
        successCount++
      } catch (error) {
        console.error(`[blog-details-sync] Erreur pour l'article ${post.slug} :`, error)
        errorCount++
      }
    }

    console.log(`[blog-details-sync] Traitement terminé : ${successCount} succès, ${errorCount} erreurs`)
    return { total: postsToProcess.length, success: successCount, errors: errorCount }
  } catch (error) {
    console.error('[blog-details-sync] Erreur globale dans fetchAndSavePostDetails :', error)
    throw error
  }
}

export default async function handler(req, res) {
  // Sécurité : vérifier le secret si configuré
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('[blog-details-sync] Démarrage du cron')
    const result = await fetchAndSavePostDetails()
    console.log('[blog-details-sync] Cron terminé avec succès')
    res.status(200).json({ ok: true, ...result })
  } catch (error) {
    console.error('[blog-details-sync] Erreur:', error)
    res.status(500).json({ error: error.message })
  }
}

