#!/usr/bin/env node
/**
 * Optimisation CTR — pages avec beaucoup d'impressions mais faible CTR
 * Affiche les pages + suggestions titre/meta par GPT pour améliorer le CTR
 *
 * Usage:
 *   node scripts/analyse-search-console-ctr.js
 *   node scripts/analyse-search-console-ctr.js --limit=5
 *   node scripts/analyse-search-console-ctr.js --no-suggestions  (sans GPT)
 */

const { google } = require('googleapis')
const fs = require('fs').promises
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

function getPageSource(pagePath) {
  const p = (pagePath || '').replace(/\/$/, '') || '/'
  if (p.startsWith('/blog/')) return { editIn: 'Blob blog-posts.json ou Notion (slug: ' + p.replace(/^\/blog\//, '').split('/')[0] + ')' }
  if (p.match(/^\/cas-usage\/[^/]+\//)) return { editIn: 'Blob case-studies.json (sector/slug)' }
  if (p.startsWith('/marketplace')) return { editIn: 'Blob marketplace-databases.json ou pages/marketplace/' }
  if (p === '/') return { editIn: 'lib/config.js → seo.pages.home' }
  return { editIn: 'À déterminer selon la page' }
}

const SITE_URL = 'sc-domain:corentinrobert.fr'
const BASE_URL = 'https://www.corentinrobert.fr'

const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 8
const noSuggestions = process.argv.includes('--no-suggestions')

async function fileExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function fetchPageMeta(pagePath) {
  try {
    const url = BASE_URL + pagePath
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CTR-Script/1.0)' } })
    const html = await res.text()
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''
    const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim() || ''
    return { title, metaDescription: metaDesc }
  } catch (e) {
    return { title: '', metaDescription: '' }
  }
}

async function getSuggestionsFromGPT(pagePath, currentTitle, currentMeta, impressions, ctr, position) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const prompt = `Page avec ${impressions} impressions, CTR ${ctr.toFixed(1)}%, position ~${Math.round(position)}.

Titre actuel : "${currentTitle}"
Meta description actuelle : "${currentMeta}"
URL : ${BASE_URL}${pagePath}

Propose 3 variantes de titre (50-60 caractères) et meta (150-160 caractères) pour améliorer le CTR dans les résultats Google.
Règles : titre percutant, meta avec bénéfice/appel à l'action, inclure mots-clés pertinents.

Réponds UNIQUEMENT en JSON :
{ "suggestions": [{ "title": "...", "metaDescription": "..." }, ...] }`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 600,
        messages: [
          { role: 'system', content: 'Tu réponds UNIQUEMENT en JSON valide.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    let content = data.choices?.[0]?.message?.content?.trim() || '{}'
    content = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(content)
    return parsed.suggestions || []
  } catch (e) {
    return null
  }
}

async function main() {
  console.log('\n📈 Optimisation CTR — Pages à fort potentiel + suggestions titre/meta\n')

  const keyPath = path.join(__dirname, '..', 'service-account-key.json')
  if (!(await fileExists(keyPath))) {
    console.error('❌ service-account-key.json introuvable')
    process.exit(1)
  }

  const creds = JSON.parse(await fs.readFile(keyPath, 'utf8'))
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  const client = google.searchconsole({ version: 'v1', auth: await auth.getClient() })

  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 90)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const { data } = await client.searchanalytics.query({
    requestBody: {
      startDate: startStr,
      endDate: endStr,
      dimensions: ['page'],
      rowLimit: 500,
    },
    siteUrl: SITE_URL,
  })

  const rows = data?.rows || []

  const lowCtr = rows
    .map((row) => ({
      url: row.keys?.[0] || '',
      path: (row.keys?.[0] || '').replace(/^https?:\/\/[^/]+/, ''),
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      ctr: (row.ctr || 0) * 100,
      position: row.position || 0,
    }))
    .filter((r) => r.impressions >= 30 && r.ctr < 2.5 && r.path)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)

  console.log(`📊 ${lowCtr.length} pages analysées (imp >= 30, CTR < 2.5%)\n`)

  for (const r of lowCtr) {
    console.log('\n' + '═'.repeat(80))
    console.log(`\n📄 ${r.path}`)
    const source = getPageSource(r.path)
    console.log(`   Impressions: ${r.impressions} | Clics: ${r.clicks} | CTR: ${r.ctr.toFixed(1)}% | Pos: ${Math.round(r.position)}`)
    console.log(`   📍 Modifier dans : ${source.editIn}`)

    const meta = await fetchPageMeta(r.path)
    if (meta.title || meta.metaDescription) {
      console.log(`   Titre actuel : ${meta.title?.slice(0, 70)}${meta.title?.length > 70 ? '...' : ''}`)
      console.log(`   Meta actuelle : ${meta.metaDescription?.slice(0, 80)}${meta.metaDescription?.length > 80 ? '...' : ''}`)
    }

    if (!noSuggestions && process.env.OPENAI_API_KEY) {
      const suggestions = await getSuggestionsFromGPT(r.path, meta.title, meta.metaDescription, r.impressions, r.ctr, r.position)
      if (suggestions?.length > 0) {
        console.log('\n   💡 Suggestions :')
        suggestions.forEach((s, i) => {
          console.log(`   ${i + 1}. Titre: "${(s.title || '').slice(0, 62)}"`)
          console.log(`      Meta: "${(s.metaDescription || '').slice(0, 155)}"`)
        })
      } else {
        console.log('\n   ⚠️  Aucune suggestion (vérifier OPENAI_API_KEY)')
      }
    }
  }

  console.log('\n' + '═'.repeat(80))
  console.log('\n✅ Terminé. Applique les suggestions manuellement dans le code/Notion.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
