// API route pour gérer les inscriptions à la newsletter
// Pour l'instant, on stocke dans Blob Storage, mais tu peux intégrer avec un service comme Mailchimp, ConvertKit, etc.

import { put, list } from '@vercel/blob'

const BLOB_FILENAME = 'newsletter-subscribers.json'

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
    if (subscribers.some((sub) => sub.email.toLowerCase() === emailLower)) {
      return res.status(200).json({
        success: true,
        message: 'Vous êtes déjà inscrit à la newsletter',
      })
    }

    // Ajouter le nouvel abonné
    subscribers.push({
      email: emailLower,
      subscribedAt: new Date().toISOString(),
      source: 'blog',
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

    // TODO: Intégrer avec un service d'email marketing (Mailchimp, ConvertKit, etc.)
    // Exemple avec Mailchimp:
    // await fetch(`https://usX.api.mailchimp.com/3.0/lists/${LIST_ID}/members`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     email_address: email,
    //     status: 'subscribed',
    //   }),
    // })

    console.log(`✅ Nouvel abonné newsletter: ${emailLower}`)

    return res.status(200).json({
      success: true,
      message: 'Inscription réussie',
    })
  } catch (error) {
    console.error('Erreur lors de l\'inscription à la newsletter:', error)
    return res.status(500).json({ error: 'Erreur lors de l\'inscription' })
  }
}
