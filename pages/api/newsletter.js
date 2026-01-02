// API route pour gérer les inscriptions à la newsletter
// Stocke dans Blob Storage et envoie une notification Telegram (comme logement-atypique)

import { put, list } from '@vercel/blob'

const BLOB_FILENAME = 'newsletter-subscribers.json'

// Fonction pour envoyer une notification Telegram
async function sendTelegramNotification(email, success = true) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.log('Variables Telegram non configurées, notification non envoyée')
    return
  }

  try {
    const emoji = success ? '🎉' : '❌'
    const status = success ? 'Nouvelle inscription' : 'Erreur inscription'
    
    let telegramMessage = `${emoji} *${status} newsletter*\n\n`
    telegramMessage += `📧 *Email:* ${email}\n`
    telegramMessage += `📅 *Date:* ${new Date().toLocaleString('fr-FR')}\n`
    telegramMessage += `🌐 *Source:* Blog Corentin Robert`

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const tgResponse = await fetch(tgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
        parse_mode: 'Markdown',
      }),
    })

    if (tgResponse.ok) {
      console.log('Notification Telegram envoyée avec succès')
    } else {
      const body = await tgResponse.text()
      console.warn('Telegram API non OK:', tgResponse.status, body)
    }
  } catch (error) {
    console.error('Erreur envoi notification Telegram:', error)
    // Ne pas bloquer la réponse en cas d'erreur Telegram
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  try {
    // Récupérer les abonnés existants
    let subscribers = []
    try {
      const blobs = await list({ prefix: BLOB_FILENAME })
      const existingBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_FILENAME)

      if (existingBlob) {
        const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const response = await fetch(`${existingBlob.url}?t=${cacheBuster}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        })

        if (response.ok) {
          const data = await response.json()
          subscribers = data.subscribers || []
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des abonnés:', error)
    }

    // Vérifier si l'email existe déjà
    const emailLower = email.toLowerCase().trim()
    const existingSubscriber = subscribers.find((sub) => sub.email.toLowerCase() === emailLower)
    
    if (existingSubscriber) {
      // Envoyer notification Telegram même si déjà inscrit
      await sendTelegramNotification(emailLower, true)
      return res.status(200).json({
        success: true,
        message: 'Vous êtes déjà inscrit à la newsletter',
        alreadySubscribed: true,
      })
    }

    // Ajouter le nouvel abonné
    subscribers.push({
      email: emailLower,
      subscribedAt: new Date().toISOString(),
      source: 'blog',
      userAgent: req.headers['user-agent'] || 'Inconnu',
    })

    // Sauvegarder dans Blob Storage
    await put(
      BLOB_FILENAME,
      JSON.stringify(
        {
          subscribers,
          lastUpdated: new Date().toISOString(),
        },
        null,
        2
      ),
      { access: 'public', allowOverwrite: true }
    )

    // Envoyer notification Telegram
    await sendTelegramNotification(emailLower, true)

    console.log(`✅ Nouvel abonné newsletter: ${emailLower}`)

    return res.status(200).json({
      success: true,
      message: 'Inscription réussie ! Merci de votre confiance.',
    })
  } catch (error) {
    console.error('Erreur lors de l\'inscription à la newsletter:', error)
    // Envoyer notification Telegram en cas d'erreur
    await sendTelegramNotification(email || 'Email inconnu', false)
    return res.status(500).json({ error: 'Erreur lors de l\'inscription' })
  }
}
