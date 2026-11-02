import { FREE_ROWS } from './scrapers'

function demoRows(scraper, input) {
  const seed = String(input || scraper.placeholder || 'Paris').split('\n')[0].trim() || 'Paris'
  return Array.from({ length: FREE_ROWS }, (_, i) => {
    const n = i + 1
    if (scraper.inputKey === 'handles') {
      return {
        '@': `${seed.toLowerCase().replace(/\s+/g, '')}${n === 1 ? '' : n}`,
        libre: n % 3 !== 0 ? 'oui' : 'pris',
      }
    }
    if (scraper.slug === 'siren-fr') {
      return {
        SIREN: String(552032534 + n),
        entreprise: `Société ${seed} ${n}`,
        ville: 'Paris',
      }
    }
    if (scraper.slug.includes('booking')) {
      return {
        hôtel: `Hôtel ${seed} ${n}`,
        ville: seed,
        note: (8 + (n % 20) / 10).toFixed(1),
        prix: `${90 + n * 7} €`,
      }
    }
    return {
      hôte: `Hôte pro ${n} · ${seed}`,
      email: `contact${n}@exemple-${seed.toLowerCase().replace(/[^a-z0-9]+/g, '')}.fr`,
      téléphone: n % 2 === 0 ? `+33 6 00 00 00 ${String(n).padStart(2, '0')}` : '',
      annonces: 3 + (n % 8),
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
    throw new Error(text || 'Ça n’a pas sorti')
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
