import { getApifyUsersHistory } from '../../lib/notion'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const history = await getApifyUsersHistory()
    res.status(200).json(history)
  } catch (error) {
    console.error('Erreur API apify-users-history:', error)
    
    // Si c'est un rate limit, retourner un tableau vide plutôt qu'une erreur
    const isRateLimit = error.message?.includes('rate_limited') || 
                       error.message?.includes('429') || 
                       error.status === 429 ||
                       error.code === 'rate_limited' ||
                       error.code === 'rate_limit_exceeded'
    
    if (isRateLimit) {
      console.warn('⚠️ Rate limit détecté, retour d\'un historique vide pour Apify users')
      return res.status(200).json([])
    }
    
    // Pour les autres erreurs, retourner aussi un tableau vide
    return res.status(200).json([])
  }
}

