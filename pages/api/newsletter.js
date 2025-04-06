export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Envoi des données à Google Sheets via webhook
    const response = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        date: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi à Google Sheets')
    }

    res.status(200).json({ message: 'Subscription successful' })
  } catch (error) {
    console.error('Error in newsletter subscription:', error)
    res.status(500).json({ message: 'Error processing subscription' })
  }
} 