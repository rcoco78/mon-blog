#!/usr/bin/env node
/**
 * Test manuel du cron Tella marketplace videos
 * Appelle directement la logique (bypass HTTP/auth)
 * Usage: node scripts/test-tella-marketplace-cron.js
 * Nécessite : .env.local avec TELLA_API_KEY, TELLA_TARGET_PLAYLIST_ID, BLOB_READ_WRITE_TOKEN
 */

require('dotenv').config({ path: '.env.local' })

async function run() {
  const handler = (await import('../pages/api/cron/tella-marketplace-videos.js')).default
  const req = { headers: { 'x-vercel-cron': '1' } }
  const res = {
    statusCode: 200,
    _body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this._body = body
      console.log(JSON.stringify(body, null, 2))
      return this
    },
  }
  await handler(req, res)
}

run().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
