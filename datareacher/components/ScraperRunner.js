'use client'

import { useMemo, useState } from 'react'
import { FREE_ROWS, creditHint } from '@/lib/scrapers'

function columnsFromRows(rows) {
  if (!rows?.length) return []
  return Object.keys(rows[0])
}

export default function ScraperRunner({ scraper }) {
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [paying, setPaying] = useState(false)
  const isTextarea = scraper.inputKey === 'handles' || scraper.inputKey === 'sirens'
  const hint = creditHint(scraper)

  const columns = useMemo(() => columnsFromRows(result?.rows), [result])

  async function onRun(event) {
    event.preventDefault()
    setError('')
    setRunning(true)
    setResult(null)
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: scraper.slug, input: input.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Le run a échoué')
      setResult(data)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setRunning(false)
    }
  }

  async function onPay() {
    setPaying(true)
    setError('')
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: 'standard', scraperSlug: scraper.slug }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Checkout impossible')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Erreur Stripe')
      setPaying(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-widest text-mute">{scraper.category}</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight text-ink">{scraper.name}</h1>
      <p className="mt-3 text-mute">{scraper.promise}</p>
      <p className="mt-2 text-sm text-mute">{hint} · {FREE_ROWS} lignes offertes, sans compte</p>

      <form onSubmit={onRun} className="mt-10">
        <label className="block text-sm text-ink" htmlFor="scraper-input">
          {scraper.inputLabel}
        </label>
        {isTextarea ? (
          <textarea
            id="scraper-input"
            required
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={scraper.placeholder}
            className="mt-2 w-full rounded-md border border-line bg-cream px-3 py-2 font-mono text-sm outline-none focus:border-pine"
          />
        ) : (
          <input
            id="scraper-input"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={scraper.placeholder}
            className="mt-2 w-full rounded-md border border-line bg-cream px-3 py-2 outline-none focus:border-pine"
          />
        )}
        <button
          type="submit"
          disabled={running}
          className="mt-4 rounded-full bg-pine px-5 py-2.5 text-sm text-white hover:bg-pineHover disabled:opacity-60"
        >
          {running ? 'Exécution…' : `Lancer (${FREE_ROWS} gratuits)`}
        </button>
      </form>

      {error ? <p className="mt-6 text-sm text-red-800">{error}</p> : null}

      {result?.rows?.length ? (
        <div className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl">Résultats</h2>
              <p className="mt-1 text-sm text-mute">
                {result.rows.length} {scraper.unit}s · plafond gratuit. La suite se paie en crédits Stripe.
              </p>
            </div>
            <button
              type="button"
              onClick={onPay}
              disabled={paying}
              className="rounded-full bg-ink px-5 py-2.5 text-sm text-white hover:bg-pineHover disabled:opacity-60"
            >
              {paying ? 'Redirection Stripe…' : `Récupérer la suite — à partir de 20 €`}
            </button>
          </div>

          <div className="mt-6 overflow-x-auto border border-line bg-cream">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line text-mute">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 font-normal">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {columns.map((col) => (
                      <td key={col} className="whitespace-nowrap px-3 py-2">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
