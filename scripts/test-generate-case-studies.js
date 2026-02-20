#!/usr/bin/env node
/**
 * Test manuel du cron generate-new-case-studies
 * Appelle l'API locale (le serveur dev doit tourner sur le port 3000)
 * Usage: npm run dev (dans un terminal) puis node scripts/test-generate-case-studies.js
 */

require('dotenv').config({ path: '.env.local' })

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const url = `${BASE}/api/cron/generate-new-case-studies`
const CRON_SECRET = process.env.CRON_SECRET

async function run() {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (CRON_SECRET) {
    headers.Authorization = `Bearer ${CRON_SECRET}`
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 360000) // 6 min
  let res
  try {
    res = await fetch(url, { method: 'POST', headers, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
  const body = await res.json().catch(() => ({}))
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(body, null, 2))
  if (!res.ok) process.exit(1)
}

run().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
