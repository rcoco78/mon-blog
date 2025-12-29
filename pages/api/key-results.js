import { getKeyResults } from '../../lib/notion'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const keyResults = await getKeyResults()
    res.status(200).json(keyResults)
  } catch (error) {
    console.error('Erreur API key-results:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des Key Results' })
  }
}

