import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID

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
      const slug = page.properties.Slug.rich_text[0]?.plain_text || ''

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