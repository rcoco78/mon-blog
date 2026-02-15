#!/usr/bin/env node
/**
 * Quick wins SEO — requêtes position 8-20 avec impressions
 * Objectif : identifier les opportunités pour monter sur la page 1
 *
 * Usage: node scripts/analyse-search-console-quick-wins.js
 */

const { google } = require('googleapis')
const fs = require('fs').promises
const path = require('path')

const SITE_URL = 'sc-domain:corentinrobert.fr'

async function fileExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('\n🎯 Quick Wins SEO — Requêtes pos 8-20 (quasi page 1)\n')

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
      dimensions: ['query'],
      rowLimit: 500,
    },
    siteUrl: SITE_URL,
  })

  const rows = data?.rows || []

  const sorted = rows
    .map((row) => ({
      query: row.keys?.[0] || '',
      position: row.position || 0,
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
    }))
    .filter((r) => r.query && r.position >= 8 && r.position <= 20 && r.impressions >= 10)
    .sort((a, b) => b.impressions - a.impressions)

  console.log(`📊 ${sorted.length} requêtes en position 8-20 (90 derniers jours)\n`)
  console.log('Priorité : enrichir le contenu ou améliorer les meta pour ces requêtes.\n')
  console.log('─'.repeat(80))

  sorted.slice(0, 25).forEach((r, i) => {
    console.log(`\n${i + 1}. "${r.query}"`)
    console.log(`   Position: ${r.position.toFixed(0)} | Impressions: ${r.impressions} | Clics: ${r.clicks}`)
  })

  console.log('\n' + '─'.repeat(80))
  console.log('\n✅ Analyse terminée. Priorise les 5-10 premières pour des quick wins.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
