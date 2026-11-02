import { NextResponse } from 'next/server'
import { createCreditCheckout } from '@/lib/stripe'

export async function POST(request) {
  try {
    const body = await request.json()
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
    const slug = body.scraperSlug || ''
    const checkout = await createCreditCheckout({
      packId: body.packId || 'standard',
      scraperSlug: slug,
      customerEmail: body.email,
      successUrl: `${origin}/account?paid=${body.packId || 'standard'}`,
      cancelUrl: slug ? `${origin}/s/${slug}` : `${origin}/pricing`,
    })
    return NextResponse.json(checkout)
  } catch (error) {
    return NextResponse.json({ error: 'Paiement impossible' }, { status: 400 })
  }
}
