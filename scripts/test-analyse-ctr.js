/**
 * Test local du cron analyse-ctr
 * Usage : node scripts/test-analyse-ctr.js [--force]
 */

const BASE_URL = 'http://localhost:3000'
const TIMEOUT_MS = 90_000

async function main() {
  const force = process.argv.includes('--force')
  const url = `${BASE_URL}/api/cron/analyse-ctr${force ? '?force=1' : ''}`

  console.log(`\n🔍 Test analyse-ctr${force ? ' (FORCE — ignore cooldown)' : ''}`)
  console.log(`→ ${url}\n`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      headers: process.env.CRON_SECRET
        ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
        : {},
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const data = await res.json()
    console.log(`Status: ${res.status}`)
    console.log(JSON.stringify(data, null, 2))
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      console.error(`❌ Timeout après ${TIMEOUT_MS / 1000}s`)
    } else {
      console.error('❌ Erreur:', err.message)
    }
    process.exit(1)
  }
}

main()
