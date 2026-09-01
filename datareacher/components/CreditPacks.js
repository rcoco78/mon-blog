'use client'

import { useState } from 'react'
import { CREDIT_PACKS } from '@/lib/scrapers'

export default function CreditPacks({ scraperSlug }) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  async function buy(packId) {
    setLoading(packId)
    setError('')
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, scraperSlug }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Paiement impossible')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`border bg-cream p-6 ${pack.popular ? 'border-pine' : 'border-line'}`}
          >
            <p className="text-xs uppercase tracking-widest text-mute">
              {pack.popular ? 'Celui de la vidéo' : pack.name}
            </p>
            <p className="mt-3 font-display text-4xl">{pack.euros} €</p>
            <p className="mt-1 text-sm text-mute">{pack.blurb}</p>
            <button
              type="button"
              onClick={() => buy(pack.id)}
              disabled={!!loading}
              className="mt-6 w-full rounded-full bg-pine py-2.5 text-sm text-white hover:bg-pineHover disabled:opacity-60"
            >
              {loading === pack.id ? 'Un instant…' : 'Prendre'}
            </button>
          </div>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}
    </div>
  )
}
