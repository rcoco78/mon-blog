/**
 * Test de l'API Gumroad - vérifie l'auth et les endpoints
 * Usage: node scripts/test-gumroad-api.js
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const token = process.env.GUMROAD_ACCESS_TOKEN
if (!token) {
  console.error('❌ GUMROAD_ACCESS_TOKEN manquant dans .env.local')
  process.exit(1)
}

console.log('🔑 Token présent:', token ? `${token.slice(0, 8)}...${token.slice(-4)}` : 'non')
console.log('')

async function test(name, url, options = {}) {
  const fullUrl = url.includes('?') ? `${url}&access_token=${token}` : `${url}?access_token=${token}`
  console.log(`\n--- Test: ${name} ---`)
  console.log('URL:', url.replace(token, '[TOKEN]'))
  try {
    const res = await fetch(fullUrl, options)
    const data = await res.json().catch(() => ({}))
    console.log('Status:', res.status, res.statusText)
    if (res.ok) {
      console.log('✅ Succès')
      if (data.products) console.log('   Produits:', data.products.length)
      if (data.product) console.log('   Produit:', data.product?.name || data.product?.id)
      return { ok: true, data }
    } else {
      console.log('❌ Erreur:', JSON.stringify(data, null, 2))
      return { ok: false, data }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
    return { ok: false }
  }
}

async function main() {
  // Test 1: GET /products (liste)
  const getResult = await test('GET /v2/products', 'https://api.gumroad.com/v2/products')

  // Test 2: POST /products (création) - produit minimal de test
  if (getResult.ok) {
    const postBody = {
      name: 'Test API ' + Date.now(),
      price: 100,
      description: 'Test création via API',
      url: 'https://www.corentinrobert.fr',
    }
    const postUrl = 'https://api.gumroad.com/v2/products'
    const postFullUrl = `${postUrl}?access_token=${encodeURIComponent(token)}`
    console.log('\n--- Test: POST /v2/products ---')
    console.log('Body:', JSON.stringify(postBody, null, 2))
    try {
      const res = await fetch(postFullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      })
      const data = await res.json().catch(() => ({}))
      console.log('Status:', res.status, res.statusText)
      if (res.ok) {
        console.log('✅ Création OK - endpoint existe')
        if (data.product?.id) {
          console.log('   Product ID:', data.product.id)
          console.log('   Supprimer ce produit de test sur gumroad.com si besoin')
        }
      } else {
        console.log('❌ Erreur:', JSON.stringify(data, null, 2))
      }
    } catch (err) {
      console.log('❌ Exception:', err.message)
    }
  }

  // Test 3: PUT /products/:id (mise à jour)
  if (getResult.ok && getResult.data?.products?.length > 0) {
    const firstProduct = getResult.data.products[0]
    const putUrl = `https://api.gumroad.com/v2/products/${firstProduct.id}`
    const putFullUrl = `${putUrl}?access_token=${encodeURIComponent(token)}`
    console.log('\n--- Test: PUT /v2/products/:id (update) ---')
    console.log('Product ID:', firstProduct.id, '| Name:', firstProduct.name)
    try {
      const res = await fetch(putFullUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: firstProduct.name,
          description: firstProduct.description || 'Test',
        }),
      })
      const data = await res.json().catch(() => ({}))
      console.log('Status:', res.status, res.statusText)
      console.log(res.ok ? '✅ Update OK' : '❌ Erreur:', JSON.stringify(data))
    } catch (err) {
      console.log('❌ Exception:', err.message)
    }
  }

  // Test 4: Bearer vs access_token
  console.log('\n--- Test: GET avec Bearer header ---')
  try {
    const res = await fetch('https://api.gumroad.com/v2/products', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json().catch(() => ({}))
    console.log('Status:', res.status, 'Bearer auth:', res.ok ? '✅' : '❌')
  } catch (err) {
    console.log('Exception:', err.message)
  }

  console.log('\n--- Fin des tests ---\n')
}

main()
