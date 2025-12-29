// Cron job pour synchroniser les données Notion quotidiennement
// Exécuté tous les jours à 6h00 (configuré dans vercel.json)

import { getAllPosts } from '../../../lib/notion';

export default async function handler(req, res) {
  // Vérifier que la requête vient de Vercel Cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Récupérer tous les posts depuis Notion
    const posts = await getAllPosts();
    
    // Ici, vous pouvez ajouter une logique pour :
    // - Mettre en cache les données
    // - Générer des fichiers statiques
    // - Mettre à jour une base de données
    // - Envoyer des notifications
    
    console.log(`✅ Synchronisation Notion réussie : ${posts.length} articles récupérés`);
    
    return res.status(200).json({
      success: true,
      message: `Synchronisation réussie : ${posts.length} articles`,
      count: posts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation Notion:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation',
      error: error.message
    });
  }
}




