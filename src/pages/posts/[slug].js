import Layout from '../../components/Layout'
import { Client } from '@notionhq/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { NotionRenderer } from 'react-notion-x'
import 'react-notion-x/src/styles.css'

export default function Post({ post }) {
  if (!post) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="heading-1">Article non trouvé</h1>
          <p className="text-gray-400">L'article que vous recherchez n'existe pas.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <article className="max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="heading-1">{post.title}</h1>
          <div className="flex items-center justify-between text-gray-400 mt-4">
            <time dateTime={post.date}>
              {format(new Date(post.date), 'd MMMM yyyy', { locale: fr })}
            </time>
            <span>{post.readingTime} min de lecture</span>
          </div>
        </header>

        <div className="prose prose-invert max-w-none">
          <NotionRenderer recordMap={post.content} />
        </div>
      </article>
    </Layout>
  )
}

export async function getStaticPaths() {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  })

  const databaseId = process.env.NOTION_DATABASE_ID
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Status',
      status: {
        equals: 'Published',
      },
    },
  })

  const paths = response.results.map((page) => ({
    params: { slug: page.properties.Slug.rich_text[0].plain_text },
  }))

  return {
    paths,
    fallback: true,
  }
}

export async function getStaticProps({ params }) {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  })

  const databaseId = process.env.NOTION_DATABASE_ID
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Slug',
      rich_text: {
        equals: params.slug,
      },
    },
  })

  if (response.results.length === 0) {
    return {
      props: {
        post: null,
      },
    }
  }

  const page = response.results[0]
  const blocks = await notion.blocks.children.list({
    block_id: page.id,
  })

  return {
    props: {
      post: {
        id: page.id,
        title: page.properties.Name.title[0].plain_text,
        date: page.properties.Date.date.start,
        readingTime: page.properties.ReadingTime.number,
        content: blocks,
      },
    },
    revalidate: 60,
  }
} 