// Cron job pour synchroniser les détails complets des articles avec conversion markdown
// Traite les 10 derniers articles publiés pour éviter les rate limits

import { Client } from '@notionhq/client'
import { put, list } from '@vercel/blob'
import { NotionToMarkdown } from 'notion-to-md'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID

// Fonction pour télécharger et stocker une image Notion dans Vercel Blob
async function downloadAndStoreImage(imageUrl, slug, imageIndex) {
  try {
    // Extraire le nom de fichier de l'URL
    const urlParts = imageUrl.split('?')[0].split('/')
    const fileName = urlParts[urlParts.length - 1] || `image-${imageIndex}.png`
    
    // Télécharger l'image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Erreur téléchargement image: ${imageResponse.status}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer])
    
    // Stocker dans Vercel Blob Storage
    const blobPath = `blog-images/${slug}/${fileName}`
    const blob = await put(blobPath, imageBlob, {
      access: 'public',
      allowOverwrite: true,
      contentType: imageResponse.headers.get('content-type') || 'image/png',
    })
    
    console.log(`[blog-details-sync] Image téléchargée et stockée: ${blob.url}`)
    return blob.url
  } catch (error) {
    console.error(`[blog-details-sync] Erreur téléchargement image ${imageUrl}:`, error)
    // En cas d'erreur, retourner l'URL originale
    return imageUrl
  }
}

// Alt Notion souvent = nom de fichier (ex: hyeres-mai-2026.jpeg) → pas une légende
function sanitizeImageAlt(altText, imageUrl) {
  const alt = (altText || '').trim()
  if (!alt) return ''

  const fileName = (imageUrl || '').split('/').pop()?.split('?')[0] || ''
  if (fileName && alt === fileName) return ''
  if (/\.(jpe?g|png|gif|webp|svg|heic|avif)$/i.test(alt)) return ''
  if (fileName) {
    const stem = fileName.replace(/\.[^.]+$/, '')
    if (stem && alt.toLowerCase() === stem.toLowerCase()) return ''
  }

  return alt
}

// Fonction pour traiter les images dans le markdown
async function processMarkdownImages(markdown, slug) {
  // Regex pour trouver les images markdown: ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const matches = [...markdown.matchAll(imageRegex)]
  
  if (matches.length === 0) {
    return markdown
  }
  
  console.log(`[blog-details-sync] ${matches.length} image(s) trouvée(s) dans le markdown`)
  
  let processedMarkdown = markdown
  let imageIndex = 0
  
  // Traiter chaque image
  for (const match of matches) {
    const [fullMatch, altText, imageUrl] = match
    const cleanAlt = sanitizeImageAlt(altText, imageUrl)
    
    // Vérifier si c'est une URL Notion (S3)
    if (imageUrl.includes('prod-files-secure.s3') || imageUrl.includes('notion.so') || imageUrl.includes('amazonaws.com')) {
      console.log(`[blog-details-sync] Téléchargement image Notion: ${imageUrl.substring(0, 100)}...`)
      const newUrl = await downloadAndStoreImage(imageUrl, slug, imageIndex)
      
      // Remplacer l'URL dans le markdown (sans alt fichier)
      processedMarkdown = processedMarkdown.replace(fullMatch, `![${cleanAlt}](${newUrl})`)
      imageIndex++
    } else if (cleanAlt !== altText) {
      processedMarkdown = processedMarkdown.replace(fullMatch, `![${cleanAlt}](${imageUrl})`)
    }
  }
  
  return processedMarkdown
}

async function listAllBlockChildren(blockId) {
  const results = []
  let cursor = undefined
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    })
    results.push(...response.results)
    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)
  return results
}

async function enrichBlocksWithChildren(blocks) {
  const enriched = []
  for (const block of blocks) {
    if (block?.has_children && (block.type === 'table' || block.type === 'column_list' || block.type === 'column')) {
      const children = await listAllBlockChildren(block.id)
      enriched.push({
        ...block,
        children: await enrichBlocksWithChildren(children),
      })
    } else {
      enriched.push(block)
    }
  }
  return enriched
}

async function getFullPost(post) {
  try {
    console.log(`[blog-details-sync] Récupération de l'article id=${post.id}, slug=${post.slug}`)

    // Récupérer tous les blocs (pagination) + enfants des tableaux
    const topLevelBlocks = await listAllBlockChildren(post.id)
    const blocks = await enrichBlocksWithChildren(topLevelBlocks)

    // Convertir en markdown avec notion-to-md (comme dans logement-atypique)
    const n2m = new NotionToMarkdown({ notionClient: notion })
    const mdBlocks = await n2m.pageToMarkdown(post.id)
    const mdString = n2m.toMarkdownString(mdBlocks)

    // Extraire le contenu markdown (gérer string ou objet)
    const markdownContent = typeof mdString === 'string' 
      ? mdString 
      : (mdString?.parent || '')

    // Traiter les images dans le markdown (télécharger et stocker dans Vercel Blob)
    const processedMarkdown = await processMarkdownImages(markdownContent, post.slug)

    return {
      ...post,
      contentMarkdown: processedMarkdown,
      blocks,
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

    // Traiter les 15 derniers articles + tout article indexé sans fichier détail
    const recentPosts = allPosts.slice(0, 15)
    const detailBlobs = await list({ prefix: 'blog-posts/' })
    const existingSlugs = new Set(
      detailBlobs.blobs
        .map((blob) => blob.pathname)
        .filter((pathname) => pathname.startsWith('blog-posts/') && pathname.endsWith('.json'))
        .map((pathname) => pathname.slice('blog-posts/'.length, -'.json'.length))
    )

    const missingPosts = allPosts.filter((post) => post?.slug && !existingSlugs.has(post.slug))
    const postsBySlug = new Map()
    for (const post of [...recentPosts, ...missingPosts]) {
      if (post?.slug) postsBySlug.set(post.slug, post)
    }
    const postsToProcess = Array.from(postsBySlug.values())
    console.log(
      `[blog-details-sync] Traitement de ${postsToProcess.length} articles (${recentPosts.length} récents, ${missingPosts.length} manquants)`
    )

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

