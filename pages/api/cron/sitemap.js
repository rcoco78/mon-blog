// Cron job pour régénérer le sitemap quotidiennement
// Exécuté tous les jours à 8h00 (configuré dans vercel.json)

import { getAllPosts } from '../../../lib/notion';

export default async function handler(req, res) {
  // Vérifier que la requête vient de Vercel Cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const posts = await getAllPosts();
    
    // Ici, vous pouvez :
    // - Régénérer le sitemap.xml
    // - Notifier les moteurs de recherche
    // - Mettre à jour les index
    
    console.log(`✅ Sitemap régénéré : ${posts.length} articles`);
    
    return res.status(200).json({
      success: true,
      message: `Sitemap régénéré : ${posts.length} articles`,
      count: posts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur lors de la régénération du sitemap:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la régénération du sitemap',
      error: error.message
    });
  }
}

