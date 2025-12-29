export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch('https://api.chess.com/pub/player/corent1robert/stats')
    
    if (!response.ok) {
      throw new Error(`Chess.com API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Extraire les données pertinentes
    const chessRapid = data.chess_rapid || {}
    const chessBlitz = data.chess_blitz || {}
    const tactics = data.tactics || {}

    const stats = {
      rapid: {
        current: chessRapid.last?.rating || 0,
        best: chessRapid.best?.rating || 0,
        record: chessRapid.record || { win: 0, loss: 0, draw: 0 }
      },
      blitz: {
        current: chessBlitz.last?.rating || 0,
        record: chessBlitz.record || { win: 0, loss: 0, draw: 0 }
      },
      tactics: {
        highest: tactics.highest?.rating || 0
      }
    }

    // Cache pour 1 heure
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json(stats)
  } catch (error) {
    console.error('Error fetching chess stats:', error)
    return res.status(500).json({ error: 'Failed to fetch chess stats' })
  }
}

