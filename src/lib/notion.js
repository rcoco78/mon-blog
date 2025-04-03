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
          direction: 'descending',
        },
      ],
    })

    console.log('Database query response:', response.results)
    return response.results.map((page) => {
      return {
        id: page.id,
        title: page.properties.Title.title[0]?.plain_text || '',
        date: new Date(page.properties.Date.date?.start).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        slug: page.properties.Slug.rich_text[0]?.plain_text || '',
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error)
    return []
  }
}

export async function getPostBySlug(slug) {
  try {
    console.log('Searching for post with slug:', slug)
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Slug',
        rich_text: {
          equals: slug,
        },
      },
    })

    console.log('Database query response:', response.results)

    if (response.results.length === 0) {
      console.log('No post found with slug:', slug)
      return null
    }

    const page = response.results[0]
    console.log('Found page:', page)
    
    // Récupérer le contenu complet de la page
    console.log('Fetching blocks for page:', page.id)
    const blocks = await notion.blocks.children.list({
      block_id: page.id,
      page_size: 100,
    })

    console.log('Blocks response:', blocks.results)

    // Traiter les blocs pour extraire le contenu
    const content = blocks.results.map(block => {
      console.log('Processing block:', block.type, block)
      switch (block.type) {
        case 'paragraph':
          return block.paragraph.rich_text.map(text => text.plain_text).join('')
        case 'heading_1':
          return `# ${block.heading_1.rich_text.map(text => text.plain_text).join('')}`
        case 'heading_2':
          return `## ${block.heading_2.rich_text.map(text => text.plain_text).join('')}`
        case 'heading_3':
          return `### ${block.heading_3.rich_text.map(text => text.plain_text).join('')}`
        case 'bulleted_list_item':
          return `- ${block.bulleted_list_item.rich_text.map(text => text.plain_text).join('')}`
        case 'numbered_list_item':
          return `1. ${block.numbered_list_item.rich_text.map(text => text.plain_text).join('')}`
        case 'code':
          return `\`\`\`\n${block.code.rich_text.map(text => text.plain_text).join('')}\n\`\`\``
        case 'image':
          const imageUrl = block.image.file?.url || block.image.external?.url
          if (!imageUrl) return ''
          return `![${block.image.caption.map(text => text.plain_text).join('')}](${imageUrl})`
        case 'quote':
          return `> ${block.quote.rich_text.map(text => text.plain_text).join('')}`
        case 'callout':
          return `> ${block.callout.rich_text.map(text => text.plain_text).join('')}`
        default:
          return ''
      }
    }).filter(Boolean).join('\n\n')

    console.log('Processed content:', content)

    return {
      id: page.id,
      title: page.properties.Title.title[0]?.plain_text || '',
      date: new Date(page.properties.Date.date?.start).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      slug: page.properties.Slug.rich_text[0]?.plain_text || '',
      content,
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error)
    return null
  }
} 