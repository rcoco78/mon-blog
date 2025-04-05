import { getAnalytics } from '@vercel/analytics/server'

export default async function handler(req, res) {
  const { slug } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Pour le moment, retournons un nombre fixe de vues
    // Nous implémenterons la vraie logique de comptage plus tard
    const views = Math.floor(Math.random() * 1000)
    
    return res.status(200).json({ views })
  } catch (error) {
    console.error('Error getting view count:', error)
    return res.status(500).json({ views: 0 })
  }
} 