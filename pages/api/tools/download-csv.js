import { list } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  try {
    // Récupérer la liste des emails depuis Vercel Blob
    const { blobs } = await list({ prefix: 'tools-emails/' });
    
    if (blobs.length === 0) {
      return res.status(404).json({ error: 'Aucune donnée trouvée' });
    }

    // Trier les fichiers par date (le plus récent en premier)
    const sortedBlobs = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const latestBlob = sortedBlobs[0];
    
    // Récupérer les données
    const response = await fetch(latestBlob.url);
    const emails = await response.json();

    // Vérifier si l'email existe dans les données
    const emailExists = emails.some(entry => entry.email === email);
    
    if (!emailExists) {
      return res.status(404).json({ error: 'Email non trouvé dans la base de données' });
    }

    // Filtrer les données pour cet email
    const userData = emails.filter(entry => entry.email === email);

    // Convertir en CSV
    const headers = ['Email', 'Outil', 'Date'];
    const csvRows = [
      headers.join(','),
      ...userData.map(entry => [
        entry.email,
        entry.tool || '',
        new Date(entry.timestamp).toLocaleDateString('fr-FR')
      ].join(','))
    ];

    const csv = csvRows.join('\n');

    // Envoyer le CSV en réponse
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mes-telechargements-${Date.now()}.csv"`);
    res.status(200).send(csv);

  } catch (error) {
    console.error('Erreur lors de la génération du CSV:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du CSV' });
  }
}

