// Configuration Vercel KV
// Les variables d'environnement suivantes doivent être configurées dans Vercel :
// - KV_URL
// - KV_REST_API_URL
// - KV_REST_API_TOKEN
// - KV_REST_API_READ_ONLY_TOKEN

import { kv } from '@vercel/kv'

export { kv }

