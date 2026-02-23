#!/usr/bin/env node
/**
 * Test du cron Tella marketplace videos
 * Usage: npm run dev (dans un autre terminal) puis node scripts/test-tella-marketplace-cron.js
 * Ou: curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/tella-marketplace-videos
 */

require('dotenv').config({ path: '.env.local' })

const BASE = 'http://localhost:3000'

async function run() {
  const secret = process.env.CRON_SECRET
  const url = `${BASE}/api/cron/tella-marketplace-videos`
  console.log('→ Appel', url, '(peut prendre ~60s: Tella API + GPT)')
  process.stdout.write('   En attente...')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)
  const res = await fetch(url, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    signal: controller.signal,
  })
  clearTimeout(timeout)
  console.log(' ok')
  const body = await res.json()

  if (!res.ok) {
    console.error('Erreur', res.status, body)
    process.exit(1)
  }

  const { matched = [], unmatched = [], totalDatabases, totalVideos, _debug } = body
  console.log('')
  console.log(`📊 Résultat: ${matched.length}/${totalDatabases} bases matchées sur ${totalVideos} vidéos Tella`)
  console.log('')
  if (_debug?.videos?.length) {
    console.log('📹 Vidéos Tella:')
    _debug.videos.forEach((v) => {
      const assigned = _debug.assignedVideoIds?.includes(v.id)
      console.log(`   ${assigned ? '✓' : '○'} ${v.name}`)
    })
  }
  if (_debug?.unassignedVideoNames?.length) {
    console.log('')
    console.log('⚠️ Vidéo(s) sans base assignée:', _debug.unassignedVideoNames.join(' | '))
  }
  if (matched.length > 0) {
    console.log('')
    console.log('✅ Matchés:')
    matched.forEach((m) => console.log(`   ${m.slug} → ${m.videoName} (score ${m.score})`))
  }
  if (unmatched.length > 0) {
    console.log('')
    console.log('❌ Non matchés:', unmatched.length)
    unmatched.slice(0, 10).forEach((u) => console.log(`   ${u.slug}`))
    if (unmatched.length > 10) console.log(`   ... et ${unmatched.length - 10} autres`)
  }
  console.log('')
  console.log('--- Réponse brute ---')
  console.log(JSON.stringify(body, null, 2))
}

run().catch((err) => {
  console.error('Erreur:', err.message)
  console.error('Astuce: lance "npm run dev" dans un autre terminal')
  process.exit(1)
})
