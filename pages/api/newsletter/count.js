export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Récupérer le nombre d'inscrits depuis Google Sheets
    const response = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL + '?action=count')
    const data = await response.json()
    
    res.status(200).json({ count: data.count })
  } catch (error) {
    console.error('Error fetching subscriber count:', error)
    res.status(500).json({ message: 'Error fetching subscriber count' })
  }
} 