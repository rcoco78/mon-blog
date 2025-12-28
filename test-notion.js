// Script de test pour vérifier la connexion Notion
require('dotenv').config({ path: '.env.local' })
const { Client } = require('@notionhq/client')

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID

async function testNotion() {
  try {
    console.log('🔍 Test de connexion à Notion...')
    console.log('Database ID:', databaseId)
    console.log('Token:', process.env.NOTION_TOKEN ? '✅ Présent' : '❌ Manquant')
    
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    })
    
    console.log(`\n✅ Connexion réussie !`)
    console.log(`📊 Nombre d'articles trouvés: ${response.results.length}`)
    
    if (response.results.length > 0) {
      console.log('\n📝 Premier article:')
      const first = response.results[0]
      console.log('  - ID:', first.id)
      console.log('  - Titre:', first.properties.Title?.title[0]?.plain_text || 'N/A')
      console.log('  - Slug:', first.properties.Slug?.rich_text[0]?.plain_text || 'N/A')
      console.log('  - Date:', first.properties.Date?.date?.start || 'N/A')
    } else {
      console.log('\n⚠️  Aucun article trouvé dans la base Notion')
      console.log('   Vérifiez que:')
      console.log('   1. La base Notion contient des pages')
      console.log('   2. Les propriétés sont correctement nommées (Title, Date, Slug, Tags)')
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.code === 'object_not_found') {
      console.error('   → La base Notion n\'existe pas ou l\'ID est incorrect')
    } else if (error.code === 'unauthorized') {
      console.error('   → Le token Notion est invalide ou n\'a pas les permissions')
    }
  }
}

testNotion()

