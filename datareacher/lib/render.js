import { FREE_ROWS } from './scrapers'

function demoRows(scraper, input) {
  const seed = String(input || scraper.placeholder || 'Paris').split('\n')[0].trim() || 'Paris'
  return Array.from({ length: FREE_ROWS }, (_, i) => {
    const n = i + 1
    if (scraper.inputKey === 'handles') {
      return {
        handle: `${seed.toLowerCase().replace(/\s+/g, '')}${n === 1 ? '' : n}`,
        available: n % 3 !== 0,
        network: scraper.slug.includes('instagram') ? 'instagram' : 'multi',
      }
    }
    if (scraper.slug === 'siren-fr') {
      return {
        siren: String(552032534 + n),
        name: `Société ${seed} ${n}`,
        city: 'Paris',
        naf: '62.01Z',
      }
    }
    if (scraper.slug.includes('booking')) {
      return {
        name: `Hôtel ${seed} ${n}`,
        city: seed,
        rating: (8 + (n % 20) / 10).toFixed(1),
        price: 90 + n * 7,
      }
    }
    return {
      host: `Hôte pro ${n} · ${seed}`,
      email: `contact${n}@exemple-${seed.toLowerCase().replace(/[^a-z0-9]+/g, '')}.fr`,
      phone: n % 2 === 0 ? `+33 6 00 00 00 ${String(n).padStart(2, '0')}` : '',
      listings: 3 + (n % 8),
    }
  })
}

export async function runOnRender(scraper, input) {
  const url = process.env.RENDER_WORKER_URL
  const secret = process.env.RENDER_WORKER_SECRET

  if (!url) {
    return {
      source: 'demo',
      rows: demoRows(scraper, input),
      truncated: true,
      freeLimit: FREE_ROWS,
    }
  }

  const response = await fetch(`${url.replace(/\/$/, '')}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({
      slug: scraper.slug,
      input,
      limit: FREE_ROWS,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Render ${response.status}`)
  }

  const data = await response.json()
  const rows = Array.isArray(data.rows) ? data.rows.slice(0, FREE_ROWS) : []
  return {
    source: 'render',
    rows,
    truncated: true,
    freeLimit: FREE_ROWS,
  }
}

export { demoRows }
