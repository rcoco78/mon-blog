import { getChessHistory } from '../../lib/notion'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const history = await getChessHistory()
    res.status(200).json(history)
  } catch (error) {
    console.error('Erreur API chess-history:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique Chess.com' })
  }
}

