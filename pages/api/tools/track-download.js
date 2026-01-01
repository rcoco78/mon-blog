import { list, put } from "@vercel/blob";

const DOWNLOADS_FILENAME = 'tools-downloads.json';

/**
 * Récupère le nombre de téléchargements pour un outil
 */
async function getDownloads() {
  try {
    const { blobs } = await list({ prefix: DOWNLOADS_FILENAME });
    
    if (blobs.length === 0) {
      return {};
    }

    // Prendre le fichier le plus récent
    const sortedBlobs = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const latestBlob = sortedBlobs[0];
    
    const response = await fetch(latestBlob.url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des téléchargements:', error);
    return {};
  }
}

/**
 * Incrémente le compteur de téléchargements pour un outil
 */
async function incrementDownload(toolId) {
  try {
    const downloads = await getDownloads();
    
    // Initialiser si nécessaire
    if (!downloads[toolId]) {
      downloads[toolId] = 0;
    }
    
    // Incrémenter
    downloads[toolId] = (downloads[toolId] || 0) + 1;
    downloads._lastUpdate = new Date().toISOString();
    
    // Sauvegarder
    await put(DOWNLOADS_FILENAME, JSON.stringify(downloads, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    return downloads[toolId];
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Récupérer les compteurs
    try {
      const { tool } = req.query;
      
      if (tool) {
        // Compteur pour un outil spécifique
        const downloads = await getDownloads();
        const count = downloads[tool] || 0;
        return res.status(200).json({ tool, count });
      } else {
        // Tous les compteurs
        const downloads = await getDownloads();
        return res.status(200).json(downloads);
      }
    } catch (error) {
      console.error('Erreur GET track-download:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
  }
  
  if (req.method === 'POST') {
    // Incrémenter le compteur
    try {
      const { tool } = req.body;
      
      if (!tool) {
        return res.status(400).json({ error: 'tool est requis' });
      }
      
      const count = await incrementDownload(tool);
      
      return res.status(200).json({ 
        success: true, 
        tool, 
        count 
      });
    } catch (error) {
      console.error('Erreur POST track-download:', error);
      return res.status(500).json({ error: 'Erreur lors du tracking' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

