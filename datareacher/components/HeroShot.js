'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FREE_ROWS } from '@/lib/scrapers'

const PREVIEW = 6

function columnsFromRows(rows) {
  if (!rows?.length) return []
  return Object.keys(rows[0])
}

export default function HeroShot({ scraper }) {
  const [input, setInput] = useState(scraper.placeholder || 'Paris')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [paying, setPaying] = useState(false)

  const preview = result?.rows?.slice(0, PREVIEW) || []
  const columns = useMemo(() => columnsFromRows(preview), [preview])

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
      if (!response.ok) throw new Error(data.error || 'Ça n’a pas sorti')
      setResult(data)
    } catch (err) {
      setError(err.message || 'Ça n’a pas sorti')
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
      if (!response.ok) throw new Error(data.error || 'Paiement impossible')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Paiement impossible')
      setPaying(false)
    }
  }

  return (
    <div className="border border-ink/15 bg-paper p-5 shadow-[8px_8px_0_0_#230a44]">
      <p className="text-xs uppercase tracking-widest text-mute">{scraper.category}</p>
      <p className="mt-1 font-display text-xl text-ink">{scraper.name}</p>
      <form onSubmit={onRun} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm text-ink" htmlFor="hero-shot-input">
          {scraper.inputLabel}
          <input
            id="hero-shot-input"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={scraper.placeholder}
            className="mt-1 w-full rounded-md border border-line bg-wash px-3 py-2 outline-none focus:border-pine"
          />
        </label>
        <button
          type="submit"
          disabled={running}
          className="rounded-full bg-pine px-5 py-2.5 text-sm text-white hover:bg-pineHover disabled:opacity-60"
        >
          {running ? 'Ça sort…' : `Goûter ${FREE_ROWS} lignes`}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}

      {preview.length ? (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">
              {result.rows.length} {scraper.unit}s. En voilà {preview.length}.
            </p>
            <button
              type="button"
              onClick={onPay}
              disabled={paying}
              className="rounded-full bg-ink px-4 py-2 text-sm text-white hover:bg-pineHover disabled:opacity-60"
            >
              {paying ? 'Un instant…' : 'Emporter la suite'}
            </button>
          </div>
          <div className="mt-3 overflow-x-auto border border-line">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-wash text-mute">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 font-normal">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
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
          <p className="mt-3 text-sm">
            <Link href={scraper.youtubePath} className="underline">
              Ouvrir la fiche
            </Link>
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-mute">Sans compte. Sans carte. Tu vois si c’est ça.</p>
      )}
    </div>
  )
}
