/**
 * API Marketplace Reviews
 * GET : récupère les avis (affichage public)
 * POST : soumet un avis (nécessite ref=MARKETPLACE_REVIEW_REF)
 * Fallback local : data/marketplace-reviews.json si Blob indisponible (dev uniquement)
 */
import { put, list } from '@vercel/blob'
import path from 'path'
import fs from 'fs'

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
    return res.status(200).json(visible.map(({ authorName, reviewBody, rating, productName, linkedinUrl, createdAt }) => ({
      authorName,
      reviewBody,
      rating: rating || '5',
      productName: productName || null,
      linkedinUrl: linkedinUrl || null,
      createdAt
    })))
  }

  if (req.method === 'POST') {
    const ref = req.body?.ref || req.query?.ref
    const secret = process.env.MARKETPLACE_REVIEW_REF

    if (!secret || ref !== secret) {
      return res.status(403).json({ error: 'Lien invalide ou expiré' })
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
      return res.status(400).json({ error: 'Nom et avis sont requis' })
    }
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'Profil LinkedIn requis' })
    }
    if (!productSlug) {
      return res.status(400).json({ error: 'Produit acheté requis' })
    }

    if (!linkedinUrl.startsWith('http')) linkedinUrl = `https://${linkedinUrl}`
    if (!/linkedin\.com\/in\//i.test(linkedinUrl)) {
      return res.status(400).json({ error: 'URL LinkedIn invalide (ex: linkedin.com/in/nom)' })
    }

    const reviews = await getReviews()
    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      authorName,
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
            <p><strong>De :</strong> ${authorName}</p>
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

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
