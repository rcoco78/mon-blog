import { NextResponse } from 'next/server'
import { getScraper } from '@/lib/scrapers'
import { runOnRender } from '@/lib/render'

export async function POST(request) {
  try {
    const body = await request.json()
    const scraper = getScraper(body.slug)
    if (!scraper) {
      return NextResponse.json({ error: 'Scraper inconnu' }, { status: 404 })
    }
    const input = body.input
    if (!input || !String(input).trim()) {
      return NextResponse.json({ error: 'Input requis' }, { status: 400 })
    }
    const result = await runOnRender(scraper, String(input))
    return NextResponse.json({
      slug: scraper.slug,
      creditsPerRow: scraper.creditsPerRow,
      ...result,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Run impossible' }, { status: 502 })
  }
}
