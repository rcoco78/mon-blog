/**
 * API Marketplace Reviews
 * GET : récupère les avis (affichage public)
 * POST : soumet un avis (nécessite ref=MARKETPLACE_REVIEW_REF)
 * Fallback local : data/marketplace-reviews.json si Blob indisponible (dev uniquement)
 */
import { put, list } from '@vercel/blob'
import path from 'path'
import fs from 'fs'

const MAX_REVIEW_LENGTH = 2000

// Rate limit : 3 soumissions max par IP sur 15 minutes (in-memory, par instance serverless)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 3
const rateLimitMap = new Map()

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
}

function checkRateLimit(ip) {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (valid.length >= RATE_LIMIT_MAX) {
    return false
  }
  valid.push(now)
  rateLimitMap.set(ip, valid)
  return true
}

const BLOB_FILENAME = 'marketplace-reviews.json'
const LOCAL_FALLBACK = path.join(process.cwd(), 'data', 'marketplace-reviews.json')

async function getReviewsFromBlob() {
  try {
    const blobs = await list({ prefix: BLOB_FILENAME })
    const blob = blobs.blobs.find((b) => b.pathname === BLOB_FILENAME)
    if (blob) {
      const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data : []
      }
    }
  } catch (err) {
    console.warn('[marketplace-reviews] Erreur lecture Blob:', err?.message)
  }
  return null
}

function getReviewsFromLocal() {
  if (!fs?.existsSync?.(LOCAL_FALLBACK)) return []
  try {
    const data = JSON.parse(fs.readFileSync(LOCAL_FALLBACK, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function getReviews() {
  const fromBlob = await getReviewsFromBlob()
  if (fromBlob !== null) return fromBlob
  return getReviewsFromLocal()
}

async function saveReviews(reviews) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(BLOB_FILENAME, JSON.stringify(reviews, null, 2), { access: 'public' })
      return true
    } catch (err) {
      console.warn('[marketplace-reviews] Blob failed, fallback local:', err?.message)
    }
  }
  if (!process.env.VERCEL && fs?.writeFileSync) {
    try {
      const dir = path.dirname(LOCAL_FALLBACK)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(LOCAL_FALLBACK, JSON.stringify(reviews, null, 2), 'utf8')
      return true
    } catch (err) {
      console.error('[marketplace-reviews] Erreur écriture local:', err)
      return false
    }
  }
  return false
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const reviews = await getReviews()
    const visible = reviews
      .filter((r) => r.visible !== false)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return res.status(200).json(visible.map(({ authorName, companyName, reviewBody, rating, productName, linkedinUrl, createdAt }) => {
      const displayName = [authorName, companyName].filter(Boolean).join(' — ') || ''
      return {
      authorName: displayName,
      reviewBody,
      rating: rating || '5',
      productName: productName || null,
      linkedinUrl: linkedinUrl || null,
      createdAt
    }
    }))
  }

  if (req.method === 'POST') {
    const ref = req.body?.ref || req.query?.ref
    const secret = process.env.MARKETPLACE_REVIEW_REF

    if (!secret || ref !== secret) {
      return res.status(403).json({ error: 'Lien invalide ou expiré' })
    }

    const ip = getClientIp(req)
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'Trop de soumissions. Merci de patienter quelques minutes avant de réessayer.'
      })
    }

    const authorName = (req.body.authorName || '').trim()
    const email = (req.body.email || '').trim()
    let linkedinUrl = (req.body.linkedinUrl || '').trim()
    const reviewBody = (req.body.reviewBody || '').trim()

    const productSlug = (req.body.productSlug || '').trim()
    const productName = (req.body.productName || '').trim()
    let rating = parseInt(req.body.rating, 10)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Note requise : choisissez entre 1 et 5 étoiles' })
    }
    rating = String(rating)

    if (!authorName || !reviewBody) {
      return res.status(400).json({ error: 'Nom ou nom d\'entreprise et avis sont requis' })
    }
    if (reviewBody.length > MAX_REVIEW_LENGTH) {
      return res.status(400).json({ error: `L'avis ne doit pas dépasser ${MAX_REVIEW_LENGTH} caractères` })
    }
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'Profil LinkedIn requis' })
    }
    if (!productSlug) {
      return res.status(400).json({ error: 'Produit acheté requis' })
    }

    if (!linkedinUrl.startsWith('http')) linkedinUrl = `https://${linkedinUrl}`
    if (!/linkedin\.com\/(in|company)\//i.test(linkedinUrl)) {
      return res.status(400).json({ error: 'URL LinkedIn invalide (ex: linkedin.com/in/nom ou linkedin.com/company/entreprise)' })
    }

    const reviews = await getReviews()
    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      authorName: authorName || null,
      email,
      linkedinUrl: linkedinUrl || null,
      reviewBody,
      productSlug: productSlug || null,
      productName: productName || null,
      rating,
      createdAt: new Date().toISOString(),
      visible: true
    }
    reviews.push(newReview)

    const saved = await saveReviews(reviews)
    if (!saved) {
      return res.status(500).json({
        error: 'Erreur technique. Merci de réessayer dans quelques instants.'
      })
    }

    // Notification email (optionnel : RESEND_API_KEY + MARKETPLACE_REVIEW_NOTIFY_EMAIL)
    const notifyEmail = process.env.MARKETPLACE_REVIEW_NOTIFY_EMAIL
    if (notifyEmail && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from = process.env.RESEND_FROM_EMAIL || 'Marketplace <onboarding@resend.dev>'
        await resend.emails.send({
          from,
          to: notifyEmail,
          subject: `[Marketplace] Nouvel avis : ${authorName}`,
          html: `
            <p><strong>Nouvel avis marketplace</strong></p>
            <p><strong>De :</strong> ${authorName || '-'}</p>
            ${email ? `<p><strong>Email :</strong> ${email}</p>` : ''}
            ${linkedinUrl ? `<p><strong>LinkedIn :</strong> <a href="${linkedinUrl}">${linkedinUrl}</a></p>` : ''}
            ${productName ? `<p><strong>Produit :</strong> ${productName}</p>` : ''}
            <p><strong>Avis :</strong></p>
            <p>${String(reviewBody).replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>
          `
        })
      } catch (emailErr) {
        console.warn('[marketplace-reviews] Email non envoyé:', emailErr?.message)
      }
    }

    // Notification Telegram (optionnel : TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (botToken && chatId) {
      try {
        const displayName = authorName || '-'
        const bodyStr = String(reviewBody || '')
        const excerpt = bodyStr.replace(/\n/g, ' ').slice(0, 120)
        let tgMsg = `⭐ Nouvel avis marketplace\n\n`
        tgMsg += `👤 De : ${displayName}\n`
        tgMsg += `📦 Produit : ${productName || '-'}\n`
        tgMsg += `⭐ Note : ${rating}/5\n`
        tgMsg += `💬 Avis : ${excerpt}${bodyStr.length > 120 ? '...' : ''}`
        const tgRes = await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: tgMsg })
        })
        if (!tgRes.ok) {
          console.warn('[marketplace-reviews] Telegram non envoyé:', tgRes.status)
        }
      } catch (tgErr) {
        console.warn('[marketplace-reviews] Telegram erreur:', tgErr?.message)
      }
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
